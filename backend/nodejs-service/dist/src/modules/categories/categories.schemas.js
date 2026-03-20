"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        slug: zod_1.z.string().min(3).max(80),
        name: zod_1.z.string().min(2).max(120),
        description: zod_1.z.string().max(400).optional(),
        icon: zod_1.z.string().max(120).optional()
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.updateCategorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2).max(120).optional(),
        description: zod_1.z.string().max(400).optional(),
        icon: zod_1.z.string().max(120).optional(),
        status: zod_1.z.enum(["active", "archived"]).optional()
    }),
    params: zod_1.z.object({
        categoryId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
