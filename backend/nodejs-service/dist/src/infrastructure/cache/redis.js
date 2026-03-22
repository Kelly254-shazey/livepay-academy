"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
exports.connectRedis = connectRedis;
const redis_1 = require("redis");
const env_1 = require("../../config/env");
const logger_1 = require("../../config/logger");
const redisClient = (0, redis_1.createClient)({
    url: env_1.env.REDIS_URL,
    socket: {
        connectTimeout: 1000,
        reconnectStrategy: false
    }
});
redisClient.on("error", (error) => {
    logger_1.logger.error({ error }, "Redis client error.");
});
class MemoryRedisClient {
    store = new Map();
    get isOpen() {
        return true;
    }
    async get(key) {
        const entry = this.read(key);
        return entry?.value ?? null;
    }
    async set(key, value, options) {
        const expiresAt = options?.EX ? Date.now() + options.EX * 1000 : undefined;
        this.store.set(key, { value, expiresAt });
        return "OK";
    }
    async del(keys) {
        const keyList = Array.isArray(keys) ? keys : [keys];
        let deleted = 0;
        for (const key of keyList) {
            if (this.store.delete(key)) {
                deleted += 1;
            }
        }
        return deleted;
    }
    async incr(key) {
        const next = this.readCounter(key) + 1;
        this.store.set(key, { value: String(next) });
        return next;
    }
    async decr(key) {
        const next = this.readCounter(key) - 1;
        this.store.set(key, { value: String(next) });
        return next;
    }
    async ping() {
        throw new Error("Redis fallback is active.");
    }
    async connect() { }
    async quit() {
        this.store.clear();
    }
    read(key) {
        const entry = this.store.get(key);
        if (!entry) {
            return undefined;
        }
        if (entry.expiresAt && entry.expiresAt <= Date.now()) {
            this.store.delete(key);
            return undefined;
        }
        return entry;
    }
    readCounter(key) {
        const value = Number(this.read(key)?.value ?? 0);
        return Number.isFinite(value) ? value : 0;
    }
}
let activeClient = redisClient;
exports.redis = {
    get isOpen() {
        return activeClient.isOpen;
    },
    get(key) {
        return activeClient.get(key);
    },
    set(key, value, options) {
        return activeClient.set(key, value, options);
    },
    del(keys) {
        return activeClient.del(keys);
    },
    incr(key) {
        return activeClient.incr(key);
    },
    decr(key) {
        return activeClient.decr(key);
    },
    ping() {
        return activeClient.ping();
    },
    connect() {
        return activeClient.connect();
    },
    quit() {
        return activeClient.quit();
    }
};
async function connectRedis() {
    if (activeClient.isOpen) {
        return;
    }
    try {
        await redisClient.connect();
    }
    catch (error) {
        activeClient = new MemoryRedisClient();
        logger_1.logger.warn({ error }, "Redis unavailable. Falling back to in-memory cache.");
    }
}
