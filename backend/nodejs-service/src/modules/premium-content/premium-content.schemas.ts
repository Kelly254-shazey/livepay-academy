import { z } from "zod";

const premiumContentBody = z.object({
  categoryId: z.string().uuid().optional(),
  title: z.string().min(3).max(180),
  excerpt: z.string().max(240).optional(),
  description: z.string().max(4000).optional(),
  price: z.coerce.number().min(0).default(0),
  currency: z.string().length(3).default("USD"),
  isPaid: z.boolean().default(true),
  previewAsset: z.string().url().optional(),
  contentAsset: z.string().url().optional()
});

export const createPremiumContentSchema = z.object({
  body: premiumContentBody,
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const updatePremiumContentSchema = z.object({
  body: premiumContentBody.partial(),
  params: z.object({
    contentId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

export const contentIdParamsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    contentId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

