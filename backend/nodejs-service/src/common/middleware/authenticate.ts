import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/app-error";
import { verifyAccessToken } from "../security/jwt";
import { prisma } from "../../infrastructure/db/prisma";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authorization = req.header("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return next(new AppError("Authentication required.", 401));
  }

  try {
    const token = authorization.replace("Bearer ", "");
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isSuspended: true }
    });

    if (!user || user.isSuspended) {
      return next(new AppError("Account is unavailable.", 403));
    }

    req.auth = {
      userId: user.id,
      role: user.role,
      email: user.email
    };

    return next();
  } catch {
    return next(new AppError("Invalid or expired token.", 401));
  }
}

