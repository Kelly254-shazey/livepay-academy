import { z } from "zod";

export const creatorApprovalSchema = z.object({
  body: z.object({
    notes: z.string().max(2000).optional()
  }).default({}),
  params: z.object({
    creatorUserId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

export const creatorRejectionSchema = z.object({
  body: z.object({
    notes: z.string().min(3).max(2000)
  }),
  params: z.object({
    creatorUserId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

export const creatorReviewHistorySchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    creatorUserId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

export const userSuspendSchema = z.object({
  body: z.object({
    reason: z.string().min(3).max(500)
  }),
  params: z.object({
    userId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

export const resourceSuspendSchema = z.object({
  body: z.object({
    resourceType: z.enum(["live_session", "premium_content", "class"]),
    resourceId: z.string().uuid(),
    reason: z.string().min(3).max(500)
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});
