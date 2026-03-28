import pino from "pino";
import pinoHttp from "pino-http";
import type { Request } from "express";

import { env } from "./env";

export const logger = pino({
  name: "livegate-nodejs-service",
  level: env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.x-internal-api-key",
      "req.body.code",
      "req.body.email",
      "req.body.identifier",
      "req.body.idToken",
      "req.body.password",
      "req.body.refreshToken",
      "req.body.token"
    ],
    censor: "[redacted]"
  }
});

export const httpLogger = pinoHttp({
  logger,
  customProps: (req) => ({ requestId: (req as Request).requestId })
});
