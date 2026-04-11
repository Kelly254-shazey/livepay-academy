import { createServer, type Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { corsCredentials, socketCorsOrigin } from "../../config/cors";
import { verifyAccessToken } from "../../common/security/jwt";
import { sanitizeChatMessage } from "../../common/security/xss-protection";
import { redis } from "../cache/redis";
import { prisma } from "../db/prisma";

const CHAT_WINDOW_MS = 10_000;
const CHAT_MAX_MESSAGES_PER_WINDOW = 10;

export function initializeSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: socketCorsOrigin,
      credentials: corsCredentials
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

      const decoded = verifyAccessToken(token);
      // verifyAccessToken already enforces tokenType === 'access' internally
      socket.data.viewer = decoded;
      next();
    } catch (error) {
      logger.warn({ error }, "WebSocket authentication failed.");
      next(new Error("Invalid websocket token."));
    }
  });

  io.on("connection", (socket) => {
    socket.data.joinedLives = new Set<string>();
    socket.data.chatTimestamps = [] as number[];

    socket.on("room:join", async ({ liveSessionId, roomAccessToken }) => {
      try {
        if (typeof liveSessionId !== "string" || typeof roomAccessToken !== "string") {
          throw new Error("Live room payload is invalid.");
        }

        const roomToken = jwt.verify(roomAccessToken, env.JWT_ACCESS_SECRET) as {
          kind?: string;
          liveSessionId: string;
          userId: string;
        };

        if (
          roomToken.kind !== "live_room" ||
          roomToken.liveSessionId !== liveSessionId ||
          roomToken.userId !== socket.data.viewer.sub
        ) {
          throw new Error("Room access token mismatch.");
        }

        await assertLiveRoomAccess(liveSessionId, socket.data.viewer.sub, socket.data.viewer.role);

        const roomName = `live:${liveSessionId}`;
        if (socket.rooms.has(roomName)) {
          return;
        }

        await socket.join(roomName);
        socket.data.joinedLives.add(liveSessionId);

        const connectionKey = getViewerConnectionKey(liveSessionId, socket.data.viewer.sub);
        const openConnections = await redis.incr(connectionKey);
        let count = await getViewerCount(liveSessionId);

        if (openConnections === 1) {
          count = await redis.incr(getViewerCountKey(liveSessionId));
        }

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

      if (typeof body !== "string") {
        return;
      }

      const timestamps = (socket.data.chatTimestamps as number[]).filter(
        (timestamp) => Date.now() - timestamp < CHAT_WINDOW_MS
      );
      if (timestamps.length >= CHAT_MAX_MESSAGES_PER_WINDOW) {
        socket.emit("room:error", { message: "Too many messages sent too quickly." });
        return;
      }
      timestamps.push(Date.now());
      socket.data.chatTimestamps = timestamps;

      try {
        const live = await prisma.liveSession.findUnique({
          where: { id: liveSessionId },
          select: { status: true }
        });

        if (!live || live.status !== "live") {
          socket.emit("room:error", { message: "Chat is only available while the live session is active." });
          return;
        }

        const trimmedBody = sanitizeChatMessage(body);
        const message = await prisma.liveChatMessage.create({
          data: {
            liveSessionId,
            senderId: socket.data.viewer.sub,
            body: trimmedBody
          },
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true,
                creatorProfile: {
                  select: {
                    displayName: true
                  }
                }
              }
            }
          }
        });

        io.to(roomName).emit("chat:message", {
          id: message.id,
          liveSessionId,
          body: message.body,
          senderId: message.senderId,
          authorName:
            message.sender?.creatorProfile?.displayName ??
            `${message.sender?.firstName ?? ""} ${message.sender?.lastName ?? ""}`.trim() ??
            "Viewer",
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
      const liveRooms = [...(socket.data.joinedLives as Set<string>)];
      await Promise.all(
        liveRooms.map(async (liveSessionId) => {
          const room = `live:${liveSessionId}`;
          const connectionKey = getViewerConnectionKey(liveSessionId, socket.data.viewer.sub);
          const remainingConnections = await redis.decr(connectionKey);

          if (remainingConnections <= 0) {
            await redis.del(connectionKey);
            const nextCount = await redis.decr(getViewerCountKey(liveSessionId));
            const count = await clampViewerCount(liveSessionId, nextCount);
            io.to(room).emit("room:viewer_count", { liveSessionId, count });
            return;
          }

          const count = await getViewerCount(liveSessionId);
          io.to(room).emit("room:viewer_count", { liveSessionId, count });
        })
      );
    });
  });

  return io;
}

function getViewerCountKey(liveSessionId: string) {
  return `live:${liveSessionId}:viewer_count`;
}

function getViewerConnectionKey(liveSessionId: string, userId: string) {
  return `live:${liveSessionId}:viewer:${userId}:connections`;
}

async function getViewerCount(liveSessionId: string) {
  const current = Number((await redis.get(getViewerCountKey(liveSessionId))) ?? 0);
  return Number.isFinite(current) && current > 0 ? current : 0;
}

async function clampViewerCount(liveSessionId: string, count: number) {
  if (count >= 0) {
    return count;
  }

  await redis.set(getViewerCountKey(liveSessionId), "0");
  return 0;
}

async function assertLiveRoomAccess(liveSessionId: string, userId: string, role: string) {
  const live = await prisma.liveSession.findUnique({
    where: { id: liveSessionId },
    select: {
      id: true,
      creatorId: true,
      isPaid: true,
      status: true,
      visibility: true
    }
  });

  if (!live || ["draft", "ended", "cancelled", "suspended"].includes(live.status)) {
    throw new Error("Live session is not joinable.");
  }

  if (role === "admin" || role === "moderator" || live.creatorId === userId) {
    return;
  }

  if (live.visibility === "followers_only") {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_creatorId: {
          followerId: userId,
          creatorId: live.creatorId
        }
      }
    });

    if (!follow) {
      throw new Error("Follower access is required.");
    }
  }

  if (live.visibility === "private") {
    const invite = await prisma.accessGrant.findFirst({
      where: {
        userId,
        targetId: live.id,
        status: "active",
        targetType: { in: ["private_live_invite", "live_session"] },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      }
    });

    if (!invite) {
      throw new Error("Private live access is required.");
    }
  }

  if (!live.isPaid) {
    return;
  }

  const grant = await prisma.accessGrant.findFirst({
    where: {
      userId,
      targetType: "live_session",
      targetId: live.id,
      status: "active",
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
    }
  });

  if (!grant) {
    throw new Error("Paid live access has not been granted.");
  }
}
