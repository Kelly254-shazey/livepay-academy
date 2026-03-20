"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const prisma_json_1 = require("../db/prisma-json");
const logger_1 = require("../../config/logger");
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
                    resource: input.resource,
                    resourceId: input.resourceId,
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
