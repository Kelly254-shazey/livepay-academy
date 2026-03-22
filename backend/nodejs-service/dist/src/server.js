"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const redis_1 = require("./infrastructure/cache/redis");
const prisma_1 = require("./infrastructure/db/prisma");
const socket_1 = require("./infrastructure/realtime/socket");
async function start() {
    try {
        await prisma_1.prisma.$connect();
    }
    catch (error) {
        logger_1.logger.warn({ error }, "Database unavailable. Starting LiveGate Node.js service in degraded mode.");
    }
    await (0, redis_1.connectRedis)();
    const app = (0, app_1.createApp)();
    const server = (0, http_1.createServer)(app);
    (0, socket_1.initializeSocket)(server);
    server.listen(env_1.env.PORT, () => {
        logger_1.logger.info({ port: env_1.env.PORT }, "LiveGate Node.js service started.");
    });
    const shutdown = async () => {
        server.close(async () => {
            await prisma_1.prisma.$disconnect().catch(() => undefined);
            if (redis_1.redis.isOpen) {
                await redis_1.redis.quit();
            }
            process.exit(0);
        });
    };
    process.on("SIGINT", () => void shutdown());
    process.on("SIGTERM", () => void shutdown());
}
start().catch((error) => {
    logger_1.logger.error({ error }, "Unable to start LiveGate Node.js service.");
    process.exit(1);
});
