import { z } from "zod";

export const frontendSignInSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(72),
    role: z.enum(["viewer", "creator", "moderator", "admin"]).default("viewer")
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const frontendSignUpSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(160),
    email: z.string().email(),
    password: z.string().min(8).max(72),
    role: z.enum(["viewer", "creator"]).default("viewer")
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const frontendForgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const frontendResetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
    token: z.string().min(12),
    password: z.string().min(8).max(72)
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const categorySlugParamsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    slug: z.string().min(2).max(120)
  }),
  query: z.object({}).default({})
});

export const creatorIdParamsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    creatorId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

export const liveIdParamsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    liveId: z.string().uuid()
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

export const classIdParamsSchema = z.object({
  body: z.object({}).default({}),
  params: z.object({
    classId: z.string().uuid()
  }),
  query: z.object({}).default({})
});

export const searchQuerySchema = z.object({
  body: z.object({}).default({}),
  params: z.object({}).default({}),
  query: z.object({
    query: z.string().trim().max(120).optional(),
    category: z.string().trim().max(120).optional(),
    type: z.enum(["creator", "live", "content", "class", "all"]).default("all")
  })
});

export const checkoutSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    productType: z.enum(["live", "content", "class"])
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const payoutRequestSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive(),
    method: z.string().min(2).max(120),
    note: z.string().max(500).optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});
