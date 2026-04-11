import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";

import { AppError } from "../errors/app-error";
import { deriveUserRoles, pickActiveRole } from "../auth/roles";
import { verifyAccessToken } from "../security/jwt";
import { prisma } from "../../infrastructure/db/prisma";

async function resolveAuthContext(authorization: string, requestedRole?: string | string[]) {
  const token = authorization.replace("Bearer ", "");
  const payload = verifyAccessToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      role: true,
      isSuspended: true,
      creatorProfile: {
        select: { id: true }
      }
    }
  });

  if (!user || user.isSuspended) {
    throw new AppError("Account is unavailable.", 403);
  }

  const roles = deriveUserRoles({
    role: user.role,
    hasCreatorProfile: Boolean(user.creatorProfile)
  });
  const normalizedRequestedRole = Array.isArray(requestedRole) ? requestedRole[0] : requestedRole;

  if (normalizedRequestedRole && !roles.includes(normalizedRequestedRole as UserRole)) {
    throw new AppError("Requested role is not available for this account.", 403);
  }

  return {
    userId: user.id,
    role: pickActiveRole(roles, {
      requestedRole: normalizedRequestedRole,
      fallbackRole: payload.role as UserRole
    }),
    roles,
    email: user.email
  };
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return next(new AppError("Authentication required.", 401));
  }

  try {
    req.auth = await resolveAuthContext(authorization, req.header("x-active-role"));
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
    req.auth = await resolveAuthContext(authorization, req.header("x-active-role"));
    return next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    return next(new AppError("Invalid or expired token.", 401));
  }
}
