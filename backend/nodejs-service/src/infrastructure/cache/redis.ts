import { createClient } from "redis";

import { env } from "../../config/env";
import { logger } from "../../config/logger";

export const redis = createClient({
  url: env.REDIS_URL
});

export type AppRedisClient = typeof redis;

redis.on("error", (error) => {
  logger.error({ error }, "Redis client error.");
});

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}
