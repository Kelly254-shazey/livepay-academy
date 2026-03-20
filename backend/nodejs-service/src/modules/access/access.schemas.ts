import { z } from "zod";

export const confirmPurchaseSchema = z.object({
  body: z.object({
    targetType: z.enum(["live_session", "premium_content", "class"]),
    targetId: z.string().uuid(),
    providerReference: z.string().min(8).max(120),
    idempotencyKey: z.string().min(8).max(120).optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const accessGrantStatusSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    targetType: z.enum(["live_session", "premium_content", "class", "lesson", "private_live_invite"]),
    targetId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

