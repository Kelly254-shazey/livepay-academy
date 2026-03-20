"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accessGrantStatusSchema = exports.confirmPurchaseSchema = void 0;
const zod_1 = require("zod");
exports.confirmPurchaseSchema = zod_1.z.object({
    body: zod_1.z.object({
        targetType: zod_1.z.enum(["live_session", "premium_content", "class"]),
        targetId: zod_1.z.string().uuid(),
        providerReference: zod_1.z.string().min(8).max(120),
        idempotencyKey: zod_1.z.string().min(8).max(120).optional()
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.accessGrantStatusSchema = zod_1.z.object({
    body: zod_1.z.object({}).default({}),
    params: zod_1.z.object({
        targetType: zod_1.z.enum(["live_session", "premium_content", "class", "lesson", "private_live_invite"]),
        targetId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
