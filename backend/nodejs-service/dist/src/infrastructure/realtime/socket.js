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
const redis_1 = require("../cache/redis");
const prisma_1 = require("../db/prisma");
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
            socket.data.viewer = (0, jwt_1.verifyAccessToken)(token);
            next();
        }
        catch {
            next(new Error("Invalid websocket token."));
        }
    });
    io.on("connection", (socket) => {
        socket.on("room:join", async ({ liveSessionId, roomAccessToken }) => {
            try {
                const roomToken = jsonwebtoken_1.default.verify(roomAccessToken, env_1.env.JWT_ACCESS_SECRET);
                if (roomToken.liveSessionId !== liveSessionId ||
                    roomToken.userId !== socket.data.viewer.sub) {
                    throw new Error("Room access token mismatch.");
                }
                const roomName = `live:${liveSessionId}`;
                if (socket.rooms.has(roomName)) {
                    return;
                }
                await socket.join(roomName);
                const count = await redis_1.redis.incr(`live:${liveSessionId}:viewer_count`);
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
            if (typeof body !== "string" || !body.trim()) {
                return;
            }
            const trimmedBody = body.trim();
            if (trimmedBody.length > 2000) {
                socket.emit("room:error", { message: "Message is too long." });
                return;
            }
            try {
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
            const liveRooms = [...socket.rooms].filter((room) => room.startsWith("live:"));
            await Promise.all(liveRooms.map(async (room) => {
                const liveSessionId = room.replace("live:", "");
                const count = Math.max((await redis_1.redis.decr(`live:${liveSessionId}:viewer_count`)), 0);
                io.to(room).emit("room:viewer_count", { liveSessionId, count });
            }));
        });
    });
    return io;
}
