import { createServer } from "http";

import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { connectRedis, redis } from "./infrastructure/cache/redis";
import { prisma } from "./infrastructure/db/prisma";
import { initializeSocket } from "./infrastructure/realtime/socket";

async function start() {
  try {
    await prisma.$connect();
  } catch (error) {
    logger.warn({ error }, "Database unavailable. Starting LiveGate Node.js service in degraded mode.");
  }
  await connectRedis();

  const app = createApp();
  const server = createServer(app);
  initializeSocket(server);

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "LiveGate Node.js service started.");
  });

  const shutdown = async () => {
    server.close(async () => {
      await prisma.$disconnect().catch(() => undefined);
      if (redis.isOpen) {
        await redis.quit();
      }
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

start().catch((error) => {
  logger.error({ error }, "Unable to start LiveGate Node.js service.");
  process.exit(1);
});
