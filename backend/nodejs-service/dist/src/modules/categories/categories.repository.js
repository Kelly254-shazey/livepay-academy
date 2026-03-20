"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesRepository = void 0;
class CategoriesRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    list(status) {
        return this.db.category.findMany({
            where: status ? { status } : undefined,
            orderBy: { name: "asc" }
        });
    }
    create(data) {
        return this.db.category.create({ data });
    }
    update(categoryId, data) {
        return this.db.category.update({
            where: { id: categoryId },
            data
        });
    }
}
exports.CategoriesRepository = CategoriesRepository;
