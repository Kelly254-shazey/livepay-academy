import { z } from "zod";

export const notificationIdParamsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    notificationId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

export const announcementSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(180),
    body: z.string().min(3).max(2000),
    targetUserIds: z.array(z.string().uuid()).optional(),
    type: z.enum(["creator_announcement", "system_alert", "live_reminder"]).default("creator_announcement"),
    liveSessionId: z.string().uuid().optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

