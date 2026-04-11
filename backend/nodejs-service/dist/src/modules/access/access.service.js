"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const app_error_1 = require("../../common/errors/app-error");
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
    async confirmPurchase(_userId, _role, _input) {
        throw new app_error_1.AppError("Verified payment settlement is not configured. Purchase confirmation is disabled until provider callback verification is implemented.", 503);
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
}
exports.AccessService = AccessService;
