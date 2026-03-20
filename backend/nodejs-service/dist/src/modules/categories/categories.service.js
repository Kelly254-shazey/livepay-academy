"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
class CategoriesService {
    repository;
    redis;
    constructor(repository, redis) {
        this.repository = repository;
        this.redis = redis;
    }
    async list(status) {
        const cacheKey = `categories:${status ?? "all"}`;
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const categories = await this.repository.list(status);
        await this.redis.set(cacheKey, JSON.stringify(categories), { EX: 120 });
        return categories;
    }
    async create(data) {
        const category = await this.repository.create(data);
        await this.redis.del(["categories:all", "categories:active", "categories:archived"]);
        return category;
    }
    async update(categoryId, data) {
        const category = await this.repository.update(categoryId, data);
        await this.redis.del(["categories:all", "categories:active", "categories:archived"]);
        return category;
    }
}
exports.CategoriesService = CategoriesService;
