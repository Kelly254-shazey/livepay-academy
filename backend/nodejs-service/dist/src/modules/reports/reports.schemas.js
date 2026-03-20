"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReportStatusSchema = exports.createReportSchema = void 0;
const zod_1 = require("zod");
exports.createReportSchema = zod_1.z.object({
    body: zod_1.z.object({
        targetType: zod_1.z.enum(["live_session", "premium_content", "class", "user", "message"]),
        targetId: zod_1.z.string().uuid(),
        reason: zod_1.z.string().min(3).max(500),
        details: zod_1.z.string().max(2000).optional()
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.updateReportStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(["under_review", "resolved", "dismissed"])
    }),
    params: zod_1.z.object({
        reportId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
