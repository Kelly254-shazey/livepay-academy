import { z } from "zod";

const usernameSchema = z.string().trim().min(3).max(32);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.");
const genderSchema = z.enum(["male", "female", "prefer_not_to_say", "custom"]);
const roleSchema = z.enum(["viewer", "creator", "moderator", "admin"]);
const loginPasswordSchema = z.string().min(1).max(256);
const passwordSchema = z
  .string()
  .min(12)
  .max(72)
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/\d/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol.");

export const frontendSignInSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(3).max(160),
    password: loginPasswordSchema
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
    method: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-zA-Z0-9 .,&()\/+-]+$/, "Payout method contains unsupported characters."),
    note: z
      .string()
      .trim()
      .max(250)
      .regex(/^[^<>]*$/, "Payout note contains unsupported characters.")
      .optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const profileSettingsSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2).max(160),
    email: z.string().email(),
    roles: z.array(roleSchema).min(1).max(4),
    defaultRole: roleSchema,
    notificationPreferences: z.object({
      liveReminders: z.boolean(),
      purchaseUpdates: z.boolean(),
      creatorAnnouncements: z.boolean(),
      systemAlerts: z.boolean()
    }),
    appearancePreferences: z.object({
      theme: z.enum(["system", "light", "dark"]),
      compactMode: z.boolean()
    }),
    privacyPreferences: z.object({
      publicCreatorProfile: z.boolean(),
      communityVisibility: z.boolean()
    }),
    payoutPreferences: z.object({
      method: z
        .string()
        .trim()
        .min(2)
        .max(80)
        .regex(/^[a-zA-Z0-9 .,&()\/+-]+$/, "Payout method contains unsupported characters."),
      note: z
        .string()
        .trim()
        .max(250)
        .regex(/^[^<>]*$/, "Payout note contains unsupported characters.")
        .optional()
    }).optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});
