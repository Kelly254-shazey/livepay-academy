import type { Request } from "express";

export function parsePagination(req: Request) {
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const skip = Math.max(page - 1, 0) * limit;
  const sortBy = String(req.query.sortBy ?? "createdAt");
  const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc";

  return { page, limit, skip, sortBy, sortOrder };
}

