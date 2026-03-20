"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationPreferencesSchema = exports.creatorIdParamsSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: zod_1.z.string().min(1).max(80).optional(),
        lastName: zod_1.z.string().min(1).max(80).optional(),
        settings: zod_1.z.record(zod_1.z.any()).optional()
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.creatorIdParamsSchema = zod_1.z.object({
    body: zod_1.z.object({}).default({}),
    params: zod_1.z.object({
        creatorId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
exports.notificationPreferencesSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.boolean().optional(),
        push: zod_1.z.boolean().optional(),
        sms: zod_1.z.boolean().optional(),
        announcements: zod_1.z.boolean().optional(),
        reminders: zod_1.z.boolean().optional()
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
