import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/app-error";
import { verifyAccessToken } from "../security/jwt";
import { prisma } from "../../infrastructure/db/prisma";

async function resolveAuthContext(authorization: string) {
  const token = authorization.replace("Bearer ", "");
  const payload = verifyAccessToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true, isSuspended: true }
  });

  if (!user || user.isSuspended) {
    throw new AppError("Account is unavailable.", 403);
  }

  return {
    userId: user.id,
    role: user.role,
    email: user.email
  };
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return next(new AppError("Authentication required.", 401));
  }

  try {
    req.auth = await resolveAuthContext(authorization);
    return next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    return next(new AppError("Invalid or expired token.", 401));
  }
}

export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const authorization = req.header("authorization");

  if (!authorization) {
    return next();
  }

  if (!authorization.startsWith("Bearer ")) {
    return next(new AppError("Invalid or expired token.", 401));
  }

  try {
    req.auth = await resolveAuthContext(authorization);
    return next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    return next(new AppError("Invalid or expired token.", 401));
  }
}
