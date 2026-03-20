"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../../config/logger");
exports.prisma = new client_1.PrismaClient({
    log: [
        { emit: "event", level: "warn" },
        { emit: "event", level: "error" }
    ]
});
exports.prisma.$on("warn", (event) => {
    logger_1.logger.warn({ prisma: event }, "Prisma warning.");
});
exports.prisma.$on("error", (event) => {
    logger_1.logger.error({ prisma: event }, "Prisma error.");
});
