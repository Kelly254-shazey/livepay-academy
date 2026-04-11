import { PrismaClient } from "@prisma/client";

import { logger } from "../../config/logger";

/**
 * Safely redact sensitive data from Prisma events to prevent log injection
 */
function redactPrismaEvent(event: any): any {
  if (!event) return event;
  
  return {
    timestamp: event.timestamp,
    target: event.target,
    level: event.level,
    message: typeof event.message === 'string' ? event.message.substring(0, 200) : undefined
    // Don't include raw query or params which could contain sensitive data
  };
}

export const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "warn" },
    { emit: "event", level: "error" }
  ]
});

prisma.$on("warn", (event) => {
  logger.warn({ prisma: redactPrismaEvent(event) }, "Prisma warning.");
});

prisma.$on("error", (event) => {
  logger.error({ prisma: redactPrismaEvent(event) }, "Prisma error.");
});

