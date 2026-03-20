"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordResetConfirmSchema = exports.passwordResetRequestSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8).max(72),
        firstName: zod_1.z.string().min(1).max(80),
        lastName: zod_1.z.string().min(1).max(80),
        role: zod_1.z.enum(["viewer", "creator"]).default("viewer")
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8).max(72)
    }),
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
        token: zod_1.z.string().min(12),
        password: zod_1.z.string().min(8).max(72)
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
