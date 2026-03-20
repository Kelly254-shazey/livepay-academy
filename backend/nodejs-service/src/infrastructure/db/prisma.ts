import { PrismaClient } from "@prisma/client";

import { logger } from "../../config/logger";

export const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "warn" },
    { emit: "event", level: "error" }
  ]
});

prisma.$on("warn", (event) => {
  logger.warn({ prisma: event }, "Prisma warning.");
});

prisma.$on("error", (event) => {
  logger.error({ prisma: event }, "Prisma error.");
});

