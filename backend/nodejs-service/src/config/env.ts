import "dotenv/config";

import { z } from "zod";

function deriveMysqlUrl(source: NodeJS.ProcessEnv) {
  const host = source.MYSQLHOST ?? source.MYSQL_HOST;
  const port = source.MYSQLPORT ?? source.MYSQL_PORT ?? "3306";
  const user = source.MYSQLUSER ?? source.MYSQL_USER;
  const password = source.MYSQLPASSWORD ?? source.MYSQL_PASSWORD;
  const database = source.NODE_DATABASE_NAME ?? source.MYSQLDATABASE ?? source.MYSQL_DATABASE;

  if (!host || !user || !password || !database) {
    return undefined;
  }

  return `mysql://${user}:${password}@${host}:${port}/${database}`;
}

const runtimeEnv: Record<string, string | undefined> = { ...process.env };

if (!runtimeEnv.DATABASE_URL) {
  runtimeEnv.DATABASE_URL = runtimeEnv.DATABASE_PUBLIC_URL ?? runtimeEnv.MYSQL_URL ?? deriveMysqlUrl(process.env);
}

if (!runtimeEnv.JWT_ACCESS_SECRET && runtimeEnv.JWT_SECRET) {
  runtimeEnv.JWT_ACCESS_SECRET = runtimeEnv.JWT_SECRET;
}

if (!runtimeEnv.JWT_REFRESH_SECRET && runtimeEnv.JWT_SECRET) {
  runtimeEnv.JWT_REFRESH_SECRET = `${runtimeEnv.JWT_SECRET}-refresh`;
}

if (!runtimeEnv.JWT_ACCESS_SECRET && runtimeEnv.JWT_REFRESH_SECRET) {
  runtimeEnv.JWT_ACCESS_SECRET = `${runtimeEnv.JWT_REFRESH_SECRET}-access`;
}

if (!runtimeEnv.JWT_REFRESH_SECRET && runtimeEnv.JWT_ACCESS_SECRET) {
  runtimeEnv.JWT_REFRESH_SECRET = `${runtimeEnv.JWT_ACCESS_SECRET}-refresh`;
}

// Service URLs: prefer explicit env vars over defaults
// The run-services.sh script provides defaults like http://127.0.0.1:PORT if not set
const serverPort = process.env.SERVER_PORT ?? "8080";
const pythonServicePort = process.env.PYTHON_SERVICE_PORT ?? "8000";
if (!runtimeEnv.JAVA_FINANCE_URL) {
  runtimeEnv.JAVA_FINANCE_URL = `http://127.0.0.1:${serverPort}`;
}
if (!runtimeEnv.PYTHON_INTELLIGENCE_URL) {
  runtimeEnv.PYTHON_INTELLIGENCE_URL = `http://127.0.0.1:${pythonServicePort}`;
}

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
  CLERK_SECRET_KEY: z.string().optional(),
  INTERNAL_API_KEY: z.string().min(8),
  JAVA_FINANCE_URL: z.string().url(),
  PYTHON_INTELLIGENCE_URL: z.string().url(),
  STREAMING_PROVIDER_BASE_URL: z.string().url().default("http://streaming-provider-placeholder.internal"),
  STREAMING_PROVIDER_API_KEY: z.string().min(8).default("replace-me"),
  DEFAULT_CURRENCY: z.string().default("USD"),
  SWAGGER_ENABLED: booleanEnv.default(true)
});

export const env = envSchema.parse(runtimeEnv);
