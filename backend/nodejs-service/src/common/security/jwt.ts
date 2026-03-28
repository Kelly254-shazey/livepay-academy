import { randomUUID } from "crypto";

import jwt from "jsonwebtoken";

import { env } from "../../config/env";

type AccessTokenPayload = {
  sub: string;
  role: string;
  email: string;
};

const JWT_ISSUER = "livegate-nodejs-service";
const JWT_AUDIENCE = "livegate-clients";

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(
    {
      email: payload.email,
      role: payload.role,
      tokenType: "access"
    },
    env.JWT_ACCESS_SECRET,
    {
    subject: payload.sub,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      jwtid: randomUUID(),
      algorithm: "HS256",
      expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m`
    }
  );
}

export function signRefreshToken(payload: Pick<AccessTokenPayload, "sub" | "email">) {
  return jwt.sign(
    {
      email: payload.email,
      tokenType: "refresh"
    },
    env.JWT_REFRESH_SECRET,
    {
    subject: payload.sub,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      jwtid: randomUUID(),
      algorithm: "HS256",
      expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d`
    }
  );
}

export function verifyAccessToken(token: string) {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithms: ["HS256"]
  }) as jwt.JwtPayload;

  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.role !== "string" ||
    payload.tokenType !== "access"
  ) {
    throw new Error("Invalid access token payload.");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    role: payload.role
  } as AccessTokenPayload;
}

export function verifyRefreshToken(token: string) {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithms: ["HS256"]
  }) as jwt.JwtPayload;

  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    payload.tokenType !== "refresh"
  ) {
    throw new Error("Invalid refresh token payload.");
  }

  return {
    sub: payload.sub,
    email: payload.email
  } as Pick<AccessTokenPayload, "sub" | "email">;
}
