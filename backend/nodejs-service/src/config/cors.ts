import type { CorsOptions } from "cors";

import { env } from "./env";

const localOriginPatterns = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^https:\/\/localhost:\d+$/,
  /^https:\/\/127\.0\.0\.1:\d+$/
];

function isLocalDevelopmentOrigin(origin: string) {
  return localOriginPatterns.some((pattern) => pattern.test(origin));
}

function isConfiguredOrigin(origin: string) {
  if (env.CORS_ORIGIN === "*") {
    return true;
  }

  return env.CORS_ORIGIN.includes(origin);
}

export function isAllowedCorsOrigin(origin?: string) {
  if (!origin) {
    return true;
  }

  return isConfiguredOrigin(origin) || isLocalDevelopmentOrigin(origin);
}

export const corsOriginDelegate: CorsOptions["origin"] =
  env.CORS_ORIGIN === "*"
    ? "*"
    : (origin, callback) => {
        if (isAllowedCorsOrigin(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Not allowed by CORS"));
      };

export const socketCorsOrigin =
  env.CORS_ORIGIN === "*"
    ? "*"
    : [...env.CORS_ORIGIN, ...localOriginPatterns];

export const corsCredentials = env.CORS_ORIGIN !== "*";
