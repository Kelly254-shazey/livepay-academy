import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";

import { AppError } from "../errors/app-error";

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new AppError("Authentication required.", 401));
    }

    if (!roles.includes(req.auth.role)) {
      return next(new AppError("Forbidden.", 403));
    }

    next();
  };
}

