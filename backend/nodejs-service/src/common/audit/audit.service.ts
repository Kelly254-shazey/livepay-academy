import type { PrismaClient, UserRole } from "@prisma/client";

import { toPrismaNullableJson } from "../db/prisma-json";
import { logger } from "../../config/logger";

type AuditInput = {
  actorId?: string;
  actorRole?: UserRole;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
};

export class AuditService {
  constructor(private readonly db: PrismaClient) {}

  async record(input: AuditInput) {
    try {
      await this.db.auditLog.create({
        data: {
          actorId: input.actorId,
          actorRole: input.actorRole,
          action: input.action,
          resource: input.resource,
          resourceId: input.resourceId,
          ipAddress: input.ipAddress,
          metadata: toPrismaNullableJson(input.metadata)
        }
      });
    } catch (error) {
      logger.error({ error, audit: input }, "Audit write failed.");
    }
  }
}
