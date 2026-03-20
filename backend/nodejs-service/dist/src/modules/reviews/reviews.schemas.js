"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listReviewsSchema = exports.createReviewSchema = void 0;
const zod_1 = require("zod");
exports.createReviewSchema = zod_1.z.object({
    body: zod_1.z.object({
        targetType: zod_1.z.enum(["creator", "live_session", "premium_content", "class"]),
        targetId: zod_1.z.string().uuid(),
        rating: zod_1.z.coerce.number().int().min(1).max(5),
        comment: zod_1.z.string().max(1500).optional()
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.listReviewsSchema = zod_1.z.object({
    body: zod_1.z.object({}).default({}),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({
        targetType: zod_1.z.enum(["creator", "live_session", "premium_content", "class"]),
        targetId: zod_1.z.string().uuid()
    })
});
