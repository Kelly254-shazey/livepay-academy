import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { logger } from "../../config/logger";
import { AppError } from "./app-error";

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(422).json({
      message: "Validation failed.",
      issues: error.flatten()
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details
    });
  }

  logger.error({ error, requestId: req.requestId }, "Unhandled request error.");

  return res.status(500).json({
    message: "Internal server error."
  });
}

