import type { AuditActionCategory, PrismaClient, UserRole } from "@prisma/client";

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

function inferActionCategory(action: string, resource: string): AuditActionCategory {
  const normalizedAction = action.toLowerCase();
  const normalizedResource = resource.toLowerCase();

  if (normalizedAction.startsWith("auth.")) {
    return "auth";
  }

  if (
    normalizedAction.startsWith("payment.") ||
    normalizedResource.includes("payment") ||
    normalizedResource.includes("wallet")
  ) {
    return "payment";
  }

  if (normalizedResource.includes("session")) {
    return "session";
  }

  if (
    normalizedAction.startsWith("moderation.") ||
    normalizedResource.includes("report") ||
    normalizedResource.includes("moderation")
  ) {
    return "moderation";
  }

  if (
    normalizedAction.startsWith("security.") ||
    normalizedAction.includes("password") ||
    normalizedAction.includes("token")
  ) {
    return "security";
  }

  if (
    normalizedResource.includes("content") ||
    normalizedResource.includes("class") ||
    normalizedResource.includes("lesson") ||
    normalizedResource.includes("live_session")
  ) {
    return "content_access";
  }

  return "admin";
}

export class AuditService {
  constructor(private readonly db: PrismaClient) {}

  async record(input: AuditInput) {
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
          metadata: toPrismaNullableJson(input.metadata)
        }
      });
    } catch (error) {
      logger.error({ error, audit: input }, "Audit write failed.");
    }
  }
}
