import { z } from "zod";

export const createReportSchema = z.object({
  body: z.object({
    targetType: z.enum(["live_session", "premium_content", "class", "user", "message"]),
    targetId: z.string().uuid(),
    reason: z.string().min(3).max(500),
    details: z.string().max(2000).optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const updateReportStatusSchema = z.object({
  body: z.object({
    status: z.enum(["under_review", "resolved", "dismissed"])
  }),
  params: z.object({
    reportId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

