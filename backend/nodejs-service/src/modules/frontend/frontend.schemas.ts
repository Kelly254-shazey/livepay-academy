import { z } from "zod";

const usernameSchema = z.string().trim().min(3).max(32);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.");
const genderSchema = z.enum(["male", "female", "prefer_not_to_say", "custom"]);
const passwordSchema = z.string().min(8).max(72);

export const frontendSignInSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(3).max(160),
    password: passwordSchema
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const frontendSignUpSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(160),
    username: usernameSchema,
    email: z.string().email(),
    password: passwordSchema,
    role: z.enum(["viewer", "creator"]).default("viewer"),
    dateOfBirth: dateSchema,
    gender: genderSchema,
    customGender: z.string().trim().max(80).optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const frontendGoogleAuthSchema = z.object({
  body: z.object({
    idToken: z.string().min(20),
    role: z.enum(["viewer", "creator"]).default("viewer")
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const frontendRefreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1)
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
    code: z.string().trim().length(6),
    password: passwordSchema
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const frontendVerifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().trim().length(6)
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const frontendCompleteProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(160),
    username: usernameSchema,
    dateOfBirth: dateSchema,
    gender: genderSchema,
    customGender: z.string().trim().max(80).optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const frontendLinkPasswordSchema = z.object({
  body: z.object({
    password: passwordSchema
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const emptyBodySchema = z.object({
  body: z.object({}).default({}),
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
