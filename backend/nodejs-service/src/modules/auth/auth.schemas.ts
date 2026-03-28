import { z } from "zod";

const usernameSchema = z.string().trim().min(3).max(32);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.");
const genderSchema = z.enum(["male", "female", "prefer_not_to_say", "custom"]);
const loginPasswordSchema = z.string().min(1).max(256);
const passwordSchema = z
  .string()
  .min(12)
  .max(72)
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/\d/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol.");

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: passwordSchema,
    fullName: z.string().min(2).max(160),
    username: usernameSchema,
    role: z.enum(["viewer", "creator"]).default("viewer"),
    dateOfBirth: dateSchema,
    gender: genderSchema,
    customGender: z.string().trim().max(80).optional()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().trim().min(3).max(160),
    password: loginPasswordSchema
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const googleSignInSchema = z.object({
  body: z.object({
    idToken: z.string().min(20),
    role: z.enum(["viewer", "creator"]).default("viewer")
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1)
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const passwordResetRequestSchema = z.object({
  body: z.object({
    email: z.string().email()
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const passwordResetConfirmSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().trim().length(6),
    password: passwordSchema
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const emailVerificationConfirmSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().trim().length(6)
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const completeProfileSchema = z.object({
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

export const linkPasswordSchema = z.object({
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
