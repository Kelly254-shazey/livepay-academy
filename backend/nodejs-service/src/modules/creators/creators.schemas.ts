import { z } from "zod";

export const upsertCreatorProfileSchema = z.object({
  body: z.object({
    handle: z.string().min(3).max(40).regex(/^[a-z0-9-]+$/),
    displayName: z.string().min(2).max(120),
    headline: z.string().max(140).optional(),
    bio: z.string().max(1000).optional(),
    focusCategories: z.array(z.string()).max(5).default([])
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const creatorHandleParamsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    handle: z.string().min(3).max(40)
  }),
  query: z.object({}).default({})
});

