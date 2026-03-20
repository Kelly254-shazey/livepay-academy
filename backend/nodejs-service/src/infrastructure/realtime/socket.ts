import { createServer, type Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { verifyAccessToken } from "../../common/security/jwt";
import { redis } from "../cache/redis";
import { prisma } from "../db/prisma";

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN,
      credentials: env.CORS_ORIGIN !== "*"
    }
  });

  io.use((socket, next) => {
    try {
      const token =
        (typeof socket.handshake.auth.token === "string" && socket.handshake.auth.token) ||
        (typeof socket.handshake.headers.authorization === "string"
          ? socket.handshake.headers.authorization.replace("Bearer ", "")
          : "");

      if (!token) {
        return next(new Error("Authentication required."));
      }

      socket.data.viewer = verifyAccessToken(token);
      next();
    } catch {
      next(new Error("Invalid websocket token."));
    }
  });

  io.on("connection", (socket) => {
    socket.on("room:join", async ({ liveSessionId, roomAccessToken }) => {
      try {
        const roomToken = jwt.verify(roomAccessToken, env.JWT_ACCESS_SECRET) as {
          liveSessionId: string;
          userId: string;
        };

        if (
          roomToken.liveSessionId !== liveSessionId ||
          roomToken.userId !== socket.data.viewer.sub
        ) {
          throw new Error("Room access token mismatch.");
        }

        const roomName = `live:${liveSessionId}`;
        if (socket.rooms.has(roomName)) {
          return;
        }

        await socket.join(roomName);
        const count = await redis.incr(`live:${liveSessionId}:viewer_count`);
        io.to(roomName).emit("room:viewer_count", { liveSessionId, count });
      } catch (error) {
        logger.warn({ error, liveSessionId }, "Socket join rejected.");
        socket.emit("room:error", { message: "Unable to join room." });
      }
    });

    socket.on("chat:message", async ({ liveSessionId, body }) => {
      const roomName = `live:${liveSessionId}`;
      if (!socket.rooms.has(roomName)) {
        socket.emit("room:error", { message: "Join the room before sending messages." });
        return;
      }

      if (typeof body !== "string" || !body.trim()) {
        return;
      }

      const trimmedBody = body.trim();
      if (trimmedBody.length > 2000) {
        socket.emit("room:error", { message: "Message is too long." });
        return;
      }

      try {
        const message = await prisma.liveChatMessage.create({
          data: {
            liveSessionId,
            senderId: socket.data.viewer.sub,
            body: trimmedBody
          }
        });

        io.to(roomName).emit("chat:message", {
          id: message.id,
          liveSessionId,
          body: message.body,
          senderId: message.senderId,
          status: message.status,
          sentAt: message.createdAt.toISOString()
        });
      } catch (error) {
        logger.error({ error, liveSessionId }, "Unable to persist live chat message.");
        socket.emit("room:error", { message: "Unable to send message." });
      }
    });

    socket.on("presence:typing", ({ liveSessionId, isTyping }) => {
      const roomName = `live:${liveSessionId}`;
      if (!socket.rooms.has(roomName)) {
        return;
      }

      socket.to(roomName).emit("presence:typing", {
        liveSessionId,
        userId: socket.data.viewer.sub,
        isTyping: Boolean(isTyping)
      });
    });

    socket.on("disconnecting", async () => {
      const liveRooms = [...socket.rooms].filter((room) => room.startsWith("live:"));
      await Promise.all(
        liveRooms.map(async (room) => {
          const liveSessionId = room.replace("live:", "");
          const count = Math.max((await redis.decr(`live:${liveSessionId}:viewer_count`)), 0);
          io.to(room).emit("room:viewer_count", { liveSessionId, count });
        })
      );
    });
  });

  return io;
}
