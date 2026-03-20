"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.announcementSchema = exports.notificationIdParamsSchema = void 0;
const zod_1 = require("zod");
exports.notificationIdParamsSchema = zod_1.z.object({
    body: zod_1.z.object({}).default({}),
    params: zod_1.z.object({
        notificationId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
exports.announcementSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3).max(180),
        body: zod_1.z.string().min(3).max(2000),
        targetUserIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
        type: zod_1.z.enum(["creator_announcement", "system_alert", "live_reminder"]).default("creator_announcement"),
        liveSessionId: zod_1.z.string().uuid().optional()
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
