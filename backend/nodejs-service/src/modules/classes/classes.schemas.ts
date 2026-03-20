import { z } from "zod";

const classBody = z.object({
  categoryId: z.string().uuid().optional(),
  title: z.string().min(3).max(180),
  description: z.string().max(4000).optional(),
  price: z.coerce.number().min(0).default(0),
  currency: z.string().length(3).default("USD"),
  isPaid: z.boolean().default(true),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional()
});

export const createClassSchema = z.object({
  body: classBody,
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const updateClassSchema = z.object({
  body: classBody.partial(),
  params: z.object({
    classId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

export const addLessonSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(180),
    description: z.string().max(4000).optional(),
    orderIndex: z.coerce.number().int().min(1),
    isPreview: z.boolean().default(false),
    assetUrl: z.string().url().optional(),
    scheduledFor: z.string().datetime().optional()
  }),
  params: z.object({
    classId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

export const classIdParamsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    classId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

export const lessonAccessParamsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    classId: z.string().uuid(),
    lessonId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

