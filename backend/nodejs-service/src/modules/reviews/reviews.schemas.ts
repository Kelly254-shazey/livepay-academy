import { z } from "zod";

export const createReviewSchema = z.object({
  body: z.object({
    targetType: z.enum(["creator", "live_session", "premium_content", "class"]),
    targetId: z.string().uuid(),
    rating: z.coerce.number().int().min(1).max(5),
    comment: z.string().max(1500).optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const listReviewsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    targetType: z.enum(["creator", "live_session", "premium_content", "class"]),
    targetId: z.string().uuid()
  })
});

