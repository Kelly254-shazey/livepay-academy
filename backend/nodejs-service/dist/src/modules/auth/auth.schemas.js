"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyBodySchema = exports.linkPasswordSchema = exports.completeProfileSchema = exports.emailVerificationConfirmSchema = exports.passwordResetConfirmSchema = exports.passwordResetRequestSchema = exports.refreshTokenSchema = exports.googleSignInSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const usernameSchema = zod_1.z.string().trim().min(3).max(32);
const dateSchema = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.");
const genderSchema = zod_1.z.enum(["male", "female", "prefer_not_to_say", "custom"]);
const loginPasswordSchema = zod_1.z.string().min(1).max(256);
const passwordSchema = zod_1.z
    .string()
    .min(12)
    .max(72)
    .regex(/[a-z]/, "Password must include a lowercase letter.")
    .regex(/[A-Z]/, "Password must include an uppercase letter.")
    .regex(/\d/, "Password must include a number.")
    .regex(/[^A-Za-z0-9]/, "Password must include a symbol.");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: passwordSchema,
        fullName: zod_1.z.string().min(2).max(160),
        username: usernameSchema,
        role: zod_1.z.enum(["viewer", "creator"]).default("viewer"),
        dateOfBirth: dateSchema,
        gender: genderSchema,
        customGender: zod_1.z.string().trim().max(80).optional()
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        identifier: zod_1.z.string().trim().min(3).max(160),
        password: loginPasswordSchema
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
const googleAuthBodySchema = zod_1.z.object({
    idToken: zod_1.z.string().min(20).optional(),
    clerkToken: zod_1.z.string().min(20).optional(),
    role: zod_1.z.enum(["viewer", "creator"]).default("viewer")
}).superRefine((value, ctx) => {
    if (!value.idToken && !value.clerkToken) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ["idToken"],
            message: "A Google token or Clerk token is required."
        });
    }
});
exports.googleSignInSchema = zod_1.z.object({
    body: googleAuthBodySchema,
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.refreshTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1)
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.passwordResetRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email()
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.passwordResetConfirmSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        code: zod_1.z.string().trim().length(6),
        password: passwordSchema
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.emailVerificationConfirmSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        code: zod_1.z.string().trim().length(6)
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.completeProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(2).max(160),
        username: usernameSchema,
        dateOfBirth: dateSchema,
        gender: genderSchema,
        customGender: zod_1.z.string().trim().max(80).optional()
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.linkPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        password: passwordSchema
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.emptyBodySchema = zod_1.z.object({
    body: zod_1.z.object({}).default({}),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
