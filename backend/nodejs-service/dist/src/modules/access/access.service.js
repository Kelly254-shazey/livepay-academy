"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const app_error_1 = require("../../common/errors/app-error");
const prisma_json_1 = require("../../common/db/prisma-json");
class AccessService {
    db;
    auditService;
    javaFinanceClient;
    pythonClient;
    constructor(db, auditService, javaFinanceClient, pythonClient) {
        this.db = db;
        this.auditService = auditService;
        this.javaFinanceClient = javaFinanceClient;
        this.pythonClient = pythonClient;
    }
    async confirmPurchase(userId, role, input) {
        const target = await this.resolveTarget(input.targetType, input.targetId);
        if (!target.isPaid) {
            throw new app_error_1.AppError("This resource does not require payment.", 409);
        }
        if (target.creatorId === userId) {
            throw new app_error_1.AppError("Creators already own access to their own resources.", 409);
        }
        if (input.targetType === "live_session") {
            const live = await this.db.liveSession.findUnique({
                where: { id: input.targetId }
            });
            if (!live) {
                throw new app_error_1.AppError("Live session not found.", 404);
            }
            await this.assertLiveVisibilityAccess(live, userId, role, false);
        }
        const existing = await this.db.accessGrant.findUnique({
            where: { sourceReference: input.providerReference }
        });
        if (existing) {
            return { grant: existing, idempotent: true };
        }
        const risk = await this.pythonClient
            .scoreTransaction({
            userId,
            creatorId: target.creatorId,
            targetType: input.targetType,
            targetId: input.targetId,
            amount: target.amount,
            currency: target.currency
        })
            .catch(() => ({ riskScore: 0, decision: "allow" }));
        const riskScore = Number(risk.riskScore ?? 0);
        if (riskScore >= 85 || risk.decision === "review") {
            await this.auditService.record({
                actorId: userId,
                actorRole: role,
                action: "purchase.blocked_by_risk",
                resource: input.targetType,
                resourceId: input.targetId,
                metadata: { risk }
            });
            throw new app_error_1.AppError("Transaction requires manual review.", 409, { risk });
        }
        const finance = await this.javaFinanceClient.recordSuccessfulPurchase({
            buyerId: userId,
            creatorId: target.creatorId,
            targetType: input.targetType,
            targetId: input.targetId,
            amount: target.amount,
            currency: target.currency,
            providerReference: input.providerReference,
            idempotencyKey: input.idempotencyKey ?? input.providerReference
        });
        const grant = await this.db.$transaction(async (tx) => {
            const createdGrant = await tx.accessGrant.create({
                data: {
                    userId,
                    grantedById: userId,
                    targetType: input.targetType,
                    targetId: input.targetId,
                    sourceReference: input.providerReference,
                    price: target.amount,
                    currency: target.currency,
                    riskScore,
                    status: "active"
                }
            });
            if (input.targetType === "class") {
                await tx.enrollment.upsert({
                    where: {
                        classId_userId: {
                            classId: input.targetId,
                            userId
                        }
                    },
                    update: {
                        status: "active",
                        accessGrantId: createdGrant.id
                    },
                    create: {
                        classId: input.targetId,
                        userId,
                        status: "active",
                        accessGrantId: createdGrant.id
                    }
                });
            }
            return createdGrant;
        });
        await this.auditService.record({
            actorId: userId,
            actorRole: role,
            action: "purchase.confirmed",
            resource: input.targetType,
            resourceId: input.targetId,
            metadata: {
                providerReference: input.providerReference,
                finance,
                riskScore
            }
        });
        await this.db.notification.createMany({
            data: [
                {
                    userId,
                    type: "purchase",
                    title: "Purchase confirmed",
                    body: `Your access to ${target.title} is active.`,
                    data: (0, prisma_json_1.toPrismaJson)({
                        targetType: input.targetType,
                        targetId: input.targetId,
                        accessGrantId: grant.id
                    })
                },
                {
                    userId: target.creatorId,
                    type: "purchase",
                    title: "New sale received",
                    body: `A user purchased access to ${target.title}.`,
                    data: (0, prisma_json_1.toPrismaJson)({
                        targetType: input.targetType,
                        targetId: input.targetId,
                        buyerId: userId
                    })
                }
            ]
        });
        return { grant, finance, risk };
    }
    async getGrantStatus(userId, targetType, targetId) {
        const grant = await this.findActiveGrant(userId, targetType, targetId);
        return { allowed: Boolean(grant), grant };
    }
    async assertLiveSessionAccess(userId, role, liveSessionId) {
        const live = await this.resolveLiveAccess(userId, role, liveSessionId, false);
        return { live };
    }
    async assertLiveJoinAccess(userId, role, liveSessionId) {
        const live = await this.resolveLiveAccess(userId, role, liveSessionId, true);
        return {
            live,
            roomAccessToken: this.issueRoomToken(live.id, userId)
        };
    }
    async assertPremiumContentAccess(userId, role, contentId) {
        const content = await this.db.premiumContent.findUnique({
            where: { id: contentId }
        });
        if (!content) {
            throw new app_error_1.AppError("Premium content not found.", 404);
        }
        if (role === "admin" || role === "moderator" || content.creatorId === userId || !content.isPaid) {
            return content;
        }
        const grant = await this.findActiveGrant(userId, "premium_content", content.id);
        if (!grant) {
            throw new app_error_1.AppError("Access grant required.", 403);
        }
        return content;
    }
    async assertClassAccess(userId, role, classId) {
        const learningClass = await this.db.learningClass.findUnique({
            where: { id: classId }
        });
        if (!learningClass) {
            throw new app_error_1.AppError("Class not found.", 404);
        }
        if (role === "admin" || role === "moderator" || learningClass.creatorId === userId || !learningClass.isPaid) {
            return learningClass;
        }
        const [grant, enrollment] = await Promise.all([
            this.findActiveGrant(userId, "class", classId),
            this.db.enrollment.findUnique({
                where: {
                    classId_userId: {
                        classId,
                        userId
                    }
                }
            })
        ]);
        if (!grant && enrollment?.status !== "active") {
            throw new app_error_1.AppError("Paid class access has not been granted.", 403);
        }
        return learningClass;
    }
    async assertLessonAccess(userId, role, classId, lessonId) {
        const lesson = await this.db.classLesson.findFirst({
            where: { id: lessonId, classId },
            include: { learningClass: true }
        });
        if (!lesson) {
            throw new app_error_1.AppError("Lesson not found.", 404);
        }
        if (lesson.isPreview) {
            return lesson;
        }
        await this.assertClassAccess(userId, role, classId);
        return lesson;
    }
    async findActiveGrant(userId, targetType, targetId) {
        return this.db.accessGrant.findFirst({
            where: {
                userId,
                targetType,
                targetId,
                status: "active",
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
            },
            orderBy: { createdAt: "desc" }
        });
    }
    issueRoomToken(liveSessionId, userId) {
        return jsonwebtoken_1.default.sign({ kind: "live_room", liveSessionId, userId }, env_1.env.JWT_ACCESS_SECRET, {
            expiresIn: "10m"
        });
    }
    async resolveLiveAccess(userId, role, liveSessionId, requireJoinable) {
        const live = await this.db.liveSession.findUnique({
            where: { id: liveSessionId }
        });
        if (!live) {
            throw new app_error_1.AppError("Live session not found.", 404);
        }
        await this.assertLiveVisibilityAccess(live, userId, role, requireJoinable);
        if (role !== "admin" && role !== "moderator" && live.creatorId !== userId) {
            if (live.isPaid) {
                const grant = await this.findActiveGrant(userId, "live_session", live.id);
                if (!grant) {
                    throw new app_error_1.AppError("Paid live access has not been granted.", 403);
                }
            }
        }
        return live;
    }
    async assertLiveVisibilityAccess(live, userId, role, requireJoinable) {
        const blockedStates = requireJoinable
            ? ["draft", "ended", "cancelled", "suspended"]
            : ["draft", "cancelled", "suspended"];
        if (blockedStates.includes(live.status)) {
            throw new app_error_1.AppError(requireJoinable ? "Live session is not joinable." : "Live session is not accessible.", 409);
        }
        if (role === "admin" || role === "moderator" || live.creatorId === userId) {
            return;
        }
        if (live.visibility === "followers_only") {
            const follow = await this.db.follow.findUnique({
                where: {
                    followerId_creatorId: {
                        followerId: userId,
                        creatorId: live.creatorId
                    }
                }
            });
            if (!follow) {
                throw new app_error_1.AppError("You must follow the creator to access this live.", 403);
            }
        }
        if (live.visibility === "private") {
            const invite = await this.db.accessGrant.findFirst({
                where: {
                    userId,
                    targetId: live.id,
                    status: "active",
                    targetType: { in: ["private_live_invite", "live_session"] }
                }
            });
            if (!invite) {
                throw new app_error_1.AppError("Private live access is required.", 403);
            }
        }
    }
    async resolveTarget(targetType, targetId) {
        switch (targetType) {
            case "live_session": {
                const target = await this.db.liveSession.findUnique({ where: { id: targetId } });
                if (!target) {
                    throw new app_error_1.AppError("Live session not found.", 404);
                }
                return {
                    id: target.id,
                    creatorId: target.creatorId,
                    title: target.title,
                    amount: target.price.toString(),
                    currency: target.currency,
                    isPaid: target.isPaid
                };
            }
            case "premium_content": {
                const target = await this.db.premiumContent.findUnique({ where: { id: targetId } });
                if (!target) {
                    throw new app_error_1.AppError("Premium content not found.", 404);
                }
                return {
                    id: target.id,
                    creatorId: target.creatorId,
                    title: target.title,
                    amount: target.price.toString(),
                    currency: target.currency,
                    isPaid: target.isPaid
                };
            }
            case "class": {
                const target = await this.db.learningClass.findUnique({ where: { id: targetId } });
                if (!target) {
                    throw new app_error_1.AppError("Class not found.", 404);
                }
                return {
                    id: target.id,
                    creatorId: target.creatorId,
                    title: target.title,
                    amount: target.price.toString(),
                    currency: target.currency,
                    isPaid: target.isPaid
                };
            }
        }
        throw new app_error_1.AppError("Unsupported purchase target.", 400);
    }
}
exports.AccessService = AccessService;
