import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    slug: z.string().min(3).max(80),
    name: z.string().min(2).max(120),
    description: z.string().max(400).optional(),
    icon: z.string().max(120).optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    description: z.string().max(400).optional(),
    icon: z.string().max(120).optional(),
    status: z.enum(["active", "archived"]).optional()
  }),
  params: z.object({
    categoryId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

