import jwt from "jsonwebtoken";

import { env } from "../../config/env";

type AccessTokenPayload = {
  sub: string;
  role: string;
  email: string;
};

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    subject: payload.sub,
    expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m`
  });
}

export function signRefreshToken(payload: Pick<AccessTokenPayload, "sub" | "email">) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    subject: payload.sub,
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d`
  });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AccessTokenPayload;
}

