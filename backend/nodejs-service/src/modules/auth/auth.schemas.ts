import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(72),
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    role: z.enum(["viewer", "creator"]).default("viewer")
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(72)
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
    token: z.string().min(12),
    password: z.string().min(8).max(72)
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

