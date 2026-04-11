"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
function deriveMysqlUrl(source) {
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
const runtimeEnv = { ...process.env };
if (!runtimeEnv.DATABASE_URL) {
    runtimeEnv.DATABASE_URL = runtimeEnv.DATABASE_PUBLIC_URL ?? runtimeEnv.MYSQL_URL ?? deriveMysqlUrl(process.env);
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
    PUBLIC_API_BASE_URL: zod_1.z.string().url().optional(),
    JWT_ACCESS_SECRET: zod_1.z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
    ACCESS_TOKEN_TTL_MINUTES: zod_1.z.coerce.number().positive().default(15),
    REFRESH_TOKEN_TTL_DAYS: zod_1.z.coerce.number().positive().default(7),
    EMAIL_PROVIDER: zod_1.z.enum(["log", "resend"]).default("log"),
    EMAIL_FROM: zod_1.z.string().email().default("no-reply@livegate.app"),
    RESEND_API_BASE_URL: zod_1.z.string().url().default("https://api.resend.com"),
    RESEND_API_KEY: zod_1.z.string().optional(),
    EMAIL_CODE_TTL_MINUTES: zod_1.z.coerce.number().positive().default(15),
    PASSWORD_RESET_CODE_TTL_MINUTES: zod_1.z.coerce.number().positive().default(30),
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    CLERK_SECRET_KEY: zod_1.z.string().optional(),
    INTERNAL_API_KEY: zod_1.z.string().min(32, "INTERNAL_API_KEY must be at least 32 characters"),
    JAVA_FINANCE_URL: zod_1.z.string().url(),
    PYTHON_INTELLIGENCE_URL: zod_1.z.string().url(),
    STREAMING_PROVIDER_BASE_URL: zod_1.z.string().url().default("http://streaming-provider-placeholder.internal"),
    STREAMING_PROVIDER_API_KEY: zod_1.z.string().min(8).refine((v) => v !== "replace-me", "STREAMING_PROVIDER_API_KEY must be set to a real value").default("replace-me"),
    DEFAULT_CURRENCY: zod_1.z.string().default("USD"),
    SWAGGER_ENABLED: booleanEnv.default(false),
    SWAGGER_USERNAME: zod_1.z.string().min(1).optional(),
    SWAGGER_PASSWORD: zod_1.z.string().min(1).optional()
});
exports.env = envSchema.parse(runtimeEnv);
