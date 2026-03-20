import { CategoriesRepository } from "./categories.repository";
import type { AppRedisClient } from "../../infrastructure/cache/redis";

export class CategoriesService {
  constructor(
    private readonly repository: CategoriesRepository,
    private readonly redis: AppRedisClient
  ) {}

  async list(status?: "active" | "archived") {
    const cacheKey = `categories:${status ?? "all"}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const categories = await this.repository.list(status);
    await this.redis.set(cacheKey, JSON.stringify(categories), { EX: 120 });
    return categories;
  }

  async create(data: { slug: string; name: string; description?: string; icon?: string; createdById?: string }) {
    const category = await this.repository.create(data);
    await this.redis.del(["categories:all", "categories:active", "categories:archived"]);
    return category;
  }

  async update(categoryId: string, data: { name?: string; description?: string; icon?: string; status?: "active" | "archived" }) {
    const category = await this.repository.update(categoryId, data);
    await this.redis.del(["categories:all", "categories:active", "categories:archived"]);
    return category;
  }
}
