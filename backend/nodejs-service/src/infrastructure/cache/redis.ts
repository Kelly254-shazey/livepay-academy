import { createClient } from "redis";

import { env } from "../../config/env";
import { logger } from "../../config/logger";

type RedisSetOptions = {
  EX?: number;
};

export type AppRedisClient = {
  readonly isOpen: boolean;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: RedisSetOptions) => Promise<string | null>;
  del: (keys: string | string[]) => Promise<number>;
  incr: (key: string) => Promise<number>;
  decr: (key: string) => Promise<number>;
  ping: () => Promise<string>;
  connect: () => Promise<void>;
  quit: () => Promise<void>;
};

const redisClient = createClient({
  url: env.REDIS_URL,
  socket: {
    connectTimeout: 1000,
    reconnectStrategy: false
  }
});

redisClient.on("error", (error) => {
  logger.error({ error }, "Redis client error.");
});

class MemoryRedisClient implements AppRedisClient {
  private readonly store = new Map<string, { value: string; expiresAt?: number }>();

  get isOpen() {
    return true;
  }

  async get(key: string) {
    const entry = this.read(key);
    return entry?.value ?? null;
  }

  async set(key: string, value: string, options?: RedisSetOptions) {
    const expiresAt = options?.EX ? Date.now() + options.EX * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async del(keys: string | string[]) {
    const keyList = Array.isArray(keys) ? keys : [keys];
    let deleted = 0;

    for (const key of keyList) {
      if (this.store.delete(key)) {
        deleted += 1;
      }
    }

    return deleted;
  }

  async incr(key: string) {
    const next = this.readCounter(key) + 1;
    this.store.set(key, { value: String(next) });
    return next;
  }

  async decr(key: string) {
    const next = this.readCounter(key) - 1;
    this.store.set(key, { value: String(next) });
    return next;
  }

  async ping(): Promise<string> {
    throw new Error("Redis fallback is active.");
  }

  async connect() {}

  async quit() {
    this.store.clear();
  }

  private read(key: string) {
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

  private readCounter(key: string) {
    const value = Number(this.read(key)?.value ?? 0);
    return Number.isFinite(value) ? value : 0;
  }
}

let activeClient: AppRedisClient = redisClient as unknown as AppRedisClient;

export const redis: AppRedisClient = {
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

export async function connectRedis() {
  if (activeClient.isOpen) {
    return;
  }

  try {
    await redisClient.connect();
  } catch (error) {
    activeClient = new MemoryRedisClient();
    logger.warn({ error }, "Redis unavailable. Falling back to in-memory cache.");
  }
}
