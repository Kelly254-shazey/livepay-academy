import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(80).optional(),
    lastName: z.string().min(1).max(80).optional(),
    settings: z.record(z.any()).optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const creatorIdParamsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    creatorId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

export const notificationPreferencesSchema = z.object({
  body: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
    announcements: z.boolean().optional(),
    reminders: z.boolean().optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

