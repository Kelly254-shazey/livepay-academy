"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resourceSuspendSchema = exports.userSuspendSchema = exports.creatorReviewHistorySchema = exports.creatorRejectionSchema = exports.creatorApprovalSchema = void 0;
const zod_1 = require("zod");
exports.creatorApprovalSchema = zod_1.z.object({
    body: zod_1.z.object({
        notes: zod_1.z.string().max(2000).optional()
    }).default({}),
    params: zod_1.z.object({
        creatorUserId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
exports.creatorRejectionSchema = zod_1.z.object({
    body: zod_1.z.object({
        notes: zod_1.z.string().min(3).max(2000)
    }),
    params: zod_1.z.object({
        creatorUserId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
exports.creatorReviewHistorySchema = zod_1.z.object({
    body: zod_1.z.object({}).default({}),
    params: zod_1.z.object({
        creatorUserId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
exports.userSuspendSchema = zod_1.z.object({
    body: zod_1.z.object({
        reason: zod_1.z.string().min(3).max(500)
    }),
    params: zod_1.z.object({
        userId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
exports.resourceSuspendSchema = zod_1.z.object({
    body: zod_1.z.object({
        resourceType: zod_1.z.enum(["live_session", "premium_content", "class"]),
        resourceId: zod_1.z.string().uuid(),
        reason: zod_1.z.string().min(3).max(500)
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
