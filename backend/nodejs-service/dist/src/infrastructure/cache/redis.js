"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.connectRedis = connectRedis;
const redis_1 = require("redis");
const env_1 = require("../../config/env");
const logger_1 = require("../../config/logger");
exports.redis = (0, redis_1.createClient)({
    url: env_1.env.REDIS_URL
});
exports.redis.on("error", (error) => {
    logger_1.logger.error({ error }, "Redis client error.");
});
async function connectRedis() {
    if (!exports.redis.isOpen) {
        await exports.redis.connect();
    }
}
