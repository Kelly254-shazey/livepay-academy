import { z } from "zod";

const paymentIdentifierPattern = /^[A-Za-z0-9](?:[A-Za-z0-9._:-]{6,118}[A-Za-z0-9])?$/;

export const confirmPurchaseSchema = z.object({
  body: z.object({
    targetType: z.enum(["live_session", "premium_content", "class"]),
    targetId: z.string().uuid(),
    providerReference: z.string().trim().min(8).max(120).regex(paymentIdentifierPattern),
    idempotencyKey: z.string().trim().min(8).max(120).regex(paymentIdentifierPattern).optional()
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
