import "dotenv/config";

import { z } from "zod";

const booleanString = z
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
      code: z.ZodIssueCode.custom,
      message: `Invalid boolean value: ${value}`
    });
    return z.NEVER;
  });

const booleanEnv = z.union([z.boolean(), booleanString]);

const corsOrigins = z
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

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().trim().min(1).optional(),
  CORS_ORIGIN: corsOrigins,
  APP_BASE_URL: z.string().url().default("http://localhost:5173"),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().positive().default(30),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().positive().default(30),
  EMAIL_PROVIDER: z.enum(["log", "resend"]).default("log"),
  EMAIL_FROM: z.string().email().default("no-reply@livegate.app"),
  RESEND_API_BASE_URL: z.string().url().default("https://api.resend.com"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_CODE_TTL_MINUTES: z.coerce.number().positive().default(15),
  PASSWORD_RESET_CODE_TTL_MINUTES: z.coerce.number().positive().default(30),
  GOOGLE_CLIENT_ID: z.string().optional(),
  INTERNAL_API_KEY: z.string().min(8),
  JAVA_FINANCE_URL: z.string().url().default("http://127.0.0.1:8080"),
  PYTHON_INTELLIGENCE_URL: z.string().url().default("http://127.0.0.1:8000"),
  STREAMING_PROVIDER_BASE_URL: z.string().url().default("http://streaming-provider-placeholder.internal"),
  STREAMING_PROVIDER_API_KEY: z.string().min(8).default("replace-me"),
  DEFAULT_CURRENCY: z.string().default("USD"),
  SWAGGER_ENABLED: booleanEnv.default(true)
});

export const env = envSchema.parse(process.env);
