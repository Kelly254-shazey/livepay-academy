import { z } from "zod";

const liveBody = z.object({
  categoryId: z.string().uuid().optional(),
  title: z.string().min(3).max(180),
  description: z.string().max(4000).optional(),
  price: z.coerce.number().min(0).default(0),
  currency: z.string().length(3).default("USD"),
  isPaid: z.boolean().default(false),
  visibility: z.enum(["public", "followers_only", "private"]).default("public"),
  scheduledFor: z.string().datetime().optional(),
  roomMetadata: z.record(z.any()).optional()
});

export const createLiveSchema = z.object({
  body: liveBody,
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const updateLiveSchema = z.object({
  body: liveBody.partial(),
  params: z.object({
    liveSessionId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

export const liveIdParamsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    liveSessionId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

export const liveChatHistorySchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    liveSessionId: z.string().uuid()
  }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50)
  })
});

export const liveChatMessageStatusSchema = z.object({
  body: z.object({
    status: z.enum(["hidden", "removed"]),
    reason: z.string().min(3).max(500)
  }),
  params: z.object({
    liveSessionId: z.string().uuid(),
    messageId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

export const attendanceSchema = z.object({
  body: z.object({
    attendanceSeconds: z.coerce.number().int().min(0),
    markLeft: z.boolean().default(true)
  }),
  params: z.object({
    liveSessionId: z.string().uuid()
  }),
  query: z.object({}).default({})
});
