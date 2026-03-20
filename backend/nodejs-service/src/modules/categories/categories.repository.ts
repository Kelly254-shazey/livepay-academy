import type { PrismaClient } from "@prisma/client";

export class CategoriesRepository {
  constructor(private readonly db: PrismaClient) {}

  list(status?: "active" | "archived") {
    return this.db.category.findMany({
      where: status ? { status } : undefined,
      orderBy: { name: "asc" }
    });
  }

  create(data: { slug: string; name: string; description?: string; icon?: string; createdById?: string }) {
    return this.db.category.create({ data });
  }

  update(categoryId: string, data: { name?: string; description?: string; icon?: string; status?: "active" | "archived" }) {
    return this.db.category.update({
      where: { id: categoryId },
      data
    });
  }
}

