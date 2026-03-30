"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const prisma_json_1 = require("../db/prisma-json");
const logger_1 = require("../../config/logger");
function inferActionCategory(action, resource) {
    const normalizedAction = action.toLowerCase();
    const normalizedResource = resource.toLowerCase();
    if (normalizedAction.startsWith("auth.")) {
        return "auth";
    }
    if (normalizedAction.startsWith("payment.") ||
        normalizedResource.includes("payment") ||
        normalizedResource.includes("wallet")) {
        return "payment";
    }
    if (normalizedResource.includes("session")) {
        return "session";
    }
    if (normalizedAction.startsWith("moderation.") ||
        normalizedResource.includes("report") ||
        normalizedResource.includes("moderation")) {
        return "moderation";
    }
    if (normalizedAction.startsWith("security.") ||
        normalizedAction.includes("password") ||
        normalizedAction.includes("token")) {
        return "security";
    }
    if (normalizedResource.includes("content") ||
        normalizedResource.includes("class") ||
        normalizedResource.includes("lesson") ||
        normalizedResource.includes("live_session")) {
        return "content_access";
    }
    return "admin";
}
class AuditService {
    db;
    constructor(db) {
        this.db = db;
    }
    async record(input) {
        try {
            await this.db.auditLog.create({
                data: {
                    actorId: input.actorId,
                    actorRole: input.actorRole,
                    action: input.action,
                    actionCategory: inferActionCategory(input.action, input.resource),
                    resource: input.resource,
                    resourceType: input.resource,
                    resourceId: input.resourceId,
                    status: "success",
                    ipAddress: input.ipAddress,
                    metadata: (0, prisma_json_1.toPrismaNullableJson)(input.metadata)
                }
            });
        }
        catch (error) {
            logger_1.logger.error({ error, audit: input }, "Audit write failed.");
        }
    }
}
exports.AuditService = AuditService;
