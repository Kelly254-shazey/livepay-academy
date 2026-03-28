"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const booleanString = zod_1.z
    .string()
    .trim()
    .toLowerCase()
    .transform((value, ctx) => {
    if (["true", "1", "yes", "on"].includes(value)) {
        return true;
    }
    if (["false", "0", "no", "off"].includes(value)) {
        return false;
    }
    ctx.addIssue({
        code: zod_1.z.ZodIssueCode.custom,
        message: `Invalid boolean value: ${value}`
    });
    return zod_1.z.NEVER;
});
const booleanEnv = zod_1.z.union([zod_1.z.boolean(), booleanString]);
const corsOrigins = zod_1.z
    .string()
    .default("*")
    .transform((value) => {
    const normalized = value.trim();
    if (!normalized || normalized === "*") {
        return "*";
    }
    return normalized
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
});
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z.coerce.number().default(3000),
    DATABASE_URL: zod_1.z.string().min(1),
    REDIS_URL: zod_1.z.string().trim().min(1).optional(),
    CORS_ORIGIN: corsOrigins,
    APP_BASE_URL: zod_1.z.string().url().default("http://localhost:5173"),
    JWT_ACCESS_SECRET: zod_1.z.string().min(16),
    JWT_REFRESH_SECRET: zod_1.z.string().min(16),
    ACCESS_TOKEN_TTL_MINUTES: zod_1.z.coerce.number().positive().default(30),
    REFRESH_TOKEN_TTL_DAYS: zod_1.z.coerce.number().positive().default(30),
    EMAIL_PROVIDER: zod_1.z.enum(["log", "resend"]).default("log"),
    EMAIL_FROM: zod_1.z.string().email().default("no-reply@livegate.app"),
    RESEND_API_BASE_URL: zod_1.z.string().url().default("https://api.resend.com"),
    RESEND_API_KEY: zod_1.z.string().optional(),
    EMAIL_CODE_TTL_MINUTES: zod_1.z.coerce.number().positive().default(15),
    PASSWORD_RESET_CODE_TTL_MINUTES: zod_1.z.coerce.number().positive().default(30),
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    INTERNAL_API_KEY: zod_1.z.string().min(8),
    JAVA_FINANCE_URL: zod_1.z.string().url().default("http://127.0.0.1:8080"),
    PYTHON_INTELLIGENCE_URL: zod_1.z.string().url().default("http://127.0.0.1:8000"),
    STREAMING_PROVIDER_BASE_URL: zod_1.z.string().url().default("http://streaming-provider-placeholder.internal"),
    STREAMING_PROVIDER_API_KEY: zod_1.z.string().min(8).default("replace-me"),
    DEFAULT_CURRENCY: zod_1.z.string().default("USD"),
    SWAGGER_ENABLED: booleanEnv.default(true)
});
exports.env = envSchema.parse(process.env);
