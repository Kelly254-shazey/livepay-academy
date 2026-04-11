"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../../config/logger");
/**
 * Safely redact sensitive data from Prisma events to prevent log injection
 */
function redactPrismaEvent(event) {
    if (!event)
        return event;
    return {
        timestamp: event.timestamp,
        target: event.target,
        level: event.level,
        message: typeof event.message === 'string' ? event.message.substring(0, 200) : undefined
        // Don't include raw query or params which could contain sensitive data
    };
}
exports.prisma = new client_1.PrismaClient({
    log: [
        { emit: "event", level: "warn" },
        { emit: "event", level: "error" }
    ]
});
exports.prisma.$on("warn", (event) => {
    logger_1.logger.warn({ prisma: redactPrismaEvent(event) }, "Prisma warning.");
});
exports.prisma.$on("error", (event) => {
    logger_1.logger.error({ prisma: redactPrismaEvent(event) }, "Prisma error.");
});
