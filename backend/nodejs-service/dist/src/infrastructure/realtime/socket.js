"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = initializeSocket;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const socket_io_1 = require("socket.io");
const env_1 = require("../../config/env");
const logger_1 = require("../../config/logger");
const cors_1 = require("../../config/cors");
const jwt_1 = require("../../common/security/jwt");
const xss_protection_1 = require("../../common/security/xss-protection");
const redis_1 = require("../cache/redis");
const prisma_1 = require("../db/prisma");
const CHAT_WINDOW_MS = 10_000;
const CHAT_MAX_MESSAGES_PER_WINDOW = 10;
function initializeSocket(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: cors_1.socketCorsOrigin,
            credentials: cors_1.corsCredentials
        }
    });
    io.use((socket, next) => {
        try {
            const token = (typeof socket.handshake.auth.token === "string" && socket.handshake.auth.token) ||
                (typeof socket.handshake.headers.authorization === "string"
                    ? socket.handshake.headers.authorization.replace("Bearer ", "")
                    : "");
            if (!token) {
                return next(new Error("Authentication required."));
            }
            const decoded = (0, jwt_1.verifyAccessToken)(token);
            // verifyAccessToken already enforces tokenType === 'access' internally
            socket.data.viewer = decoded;
            next();
        }
        catch (error) {
            logger_1.logger.warn({ error }, "WebSocket authentication failed.");
            next(new Error("Invalid websocket token."));
        }
    });
    io.on("connection", (socket) => {
        socket.data.joinedLives = new Set();
        socket.data.chatTimestamps = [];
        socket.on("room:join", async ({ liveSessionId, roomAccessToken }) => {
            try {
                if (typeof liveSessionId !== "string" || typeof roomAccessToken !== "string") {
                    throw new Error("Live room payload is invalid.");
                }
                const roomToken = jsonwebtoken_1.default.verify(roomAccessToken, env_1.env.JWT_ACCESS_SECRET);
                if (roomToken.kind !== "live_room" ||
                    roomToken.liveSessionId !== liveSessionId ||
                    roomToken.userId !== socket.data.viewer.sub) {
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
                const openConnections = await redis_1.redis.incr(connectionKey);
                let count = await getViewerCount(liveSessionId);
                if (openConnections === 1) {
                    count = await redis_1.redis.incr(getViewerCountKey(liveSessionId));
                }
                io.to(roomName).emit("room:viewer_count", { liveSessionId, count });
            }
            catch (error) {
                logger_1.logger.warn({ error, liveSessionId }, "Socket join rejected.");
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
            const timestamps = socket.data.chatTimestamps.filter((timestamp) => Date.now() - timestamp < CHAT_WINDOW_MS);
            if (timestamps.length >= CHAT_MAX_MESSAGES_PER_WINDOW) {
                socket.emit("room:error", { message: "Too many messages sent too quickly." });
                return;
            }
            timestamps.push(Date.now());
            socket.data.chatTimestamps = timestamps;
            try {
                const live = await prisma_1.prisma.liveSession.findUnique({
                    where: { id: liveSessionId },
                    select: { status: true }
                });
                if (!live || live.status !== "live") {
                    socket.emit("room:error", { message: "Chat is only available while the live session is active." });
                    return;
                }
                const trimmedBody = (0, xss_protection_1.sanitizeChatMessage)(body);
                const message = await prisma_1.prisma.liveChatMessage.create({
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
                    authorName: message.sender?.creatorProfile?.displayName ??
                        `${message.sender?.firstName ?? ""} ${message.sender?.lastName ?? ""}`.trim() ??
                        "Viewer",
                    status: message.status,
                    sentAt: message.createdAt.toISOString()
                });
            }
            catch (error) {
                logger_1.logger.error({ error, liveSessionId }, "Unable to persist live chat message.");
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
            const liveRooms = [...socket.data.joinedLives];
            await Promise.all(liveRooms.map(async (liveSessionId) => {
                const room = `live:${liveSessionId}`;
                const connectionKey = getViewerConnectionKey(liveSessionId, socket.data.viewer.sub);
                const remainingConnections = await redis_1.redis.decr(connectionKey);
                if (remainingConnections <= 0) {
                    await redis_1.redis.del(connectionKey);
                    const nextCount = await redis_1.redis.decr(getViewerCountKey(liveSessionId));
                    const count = await clampViewerCount(liveSessionId, nextCount);
                    io.to(room).emit("room:viewer_count", { liveSessionId, count });
                    return;
                }
                const count = await getViewerCount(liveSessionId);
                io.to(room).emit("room:viewer_count", { liveSessionId, count });
            }));
        });
    });
    return io;
}
function getViewerCountKey(liveSessionId) {
    return `live:${liveSessionId}:viewer_count`;
}
function getViewerConnectionKey(liveSessionId, userId) {
    return `live:${liveSessionId}:viewer:${userId}:connections`;
}
async function getViewerCount(liveSessionId) {
    const current = Number((await redis_1.redis.get(getViewerCountKey(liveSessionId))) ?? 0);
    return Number.isFinite(current) && current > 0 ? current : 0;
}
async function clampViewerCount(liveSessionId, count) {
    if (count >= 0) {
        return count;
    }
    await redis_1.redis.set(getViewerCountKey(liveSessionId), "0");
    return 0;
}
async function assertLiveRoomAccess(liveSessionId, userId, role) {
    const live = await prisma_1.prisma.liveSession.findUnique({
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
        const follow = await prisma_1.prisma.follow.findUnique({
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
        const invite = await prisma_1.prisma.accessGrant.findFirst({
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
    const grant = await prisma_1.prisma.accessGrant.findFirst({
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
