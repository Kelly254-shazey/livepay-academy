"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attendanceSchema = exports.liveChatMessageStatusSchema = exports.liveChatHistorySchema = exports.liveIdParamsSchema = exports.updateLiveSchema = exports.createLiveSchema = void 0;
const zod_1 = require("zod");
const liveBody = zod_1.z.object({
    categoryId: zod_1.z.string().uuid().optional(),
    title: zod_1.z.string().min(3).max(180),
    description: zod_1.z.string().max(4000).optional(),
    price: zod_1.z.coerce.number().min(0).default(0),
    currency: zod_1.z.string().length(3).default("USD"),
    isPaid: zod_1.z.boolean().default(false),
    visibility: zod_1.z.enum(["public", "followers_only", "private"]).default("public"),
    scheduledFor: zod_1.z.string().datetime().optional(),
    roomMetadata: zod_1.z.record(zod_1.z.any()).optional()
});
exports.createLiveSchema = zod_1.z.object({
    body: liveBody,
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.updateLiveSchema = zod_1.z.object({
    body: liveBody.partial(),
    params: zod_1.z.object({
        liveSessionId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
exports.liveIdParamsSchema = zod_1.z.object({
    body: zod_1.z.object({}).default({}),
    params: zod_1.z.object({
        liveSessionId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
exports.liveChatHistorySchema = zod_1.z.object({
    body: zod_1.z.object({}).default({}),
    params: zod_1.z.object({
        liveSessionId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({
        limit: zod_1.z.coerce.number().int().min(1).max(100).default(50)
    })
});
exports.liveChatMessageStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(["hidden", "removed"]),
        reason: zod_1.z.string().min(3).max(500)
    }),
    params: zod_1.z.object({
        liveSessionId: zod_1.z.string().uuid(),
        messageId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
exports.attendanceSchema = zod_1.z.object({
    body: zod_1.z.object({
        attendanceSeconds: zod_1.z.coerce.number().int().min(0),
        markLeft: zod_1.z.boolean().default(true)
    }),
    params: zod_1.z.object({
        liveSessionId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
