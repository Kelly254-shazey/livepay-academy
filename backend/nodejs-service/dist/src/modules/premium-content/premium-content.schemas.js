"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentIdParamsSchema = exports.updatePremiumContentSchema = exports.createPremiumContentSchema = void 0;
const zod_1 = require("zod");
const premiumContentBody = zod_1.z.object({
    categoryId: zod_1.z.string().uuid().optional(),
    title: zod_1.z.string().min(3).max(180),
    excerpt: zod_1.z.string().max(240).optional(),
    description: zod_1.z.string().max(4000).optional(),
    price: zod_1.z.coerce.number().min(0).default(0),
    currency: zod_1.z.string().length(3).default("USD"),
    isPaid: zod_1.z.boolean().default(true),
    previewAsset: zod_1.z.string().url().optional(),
    contentAsset: zod_1.z.string().url().optional()
});
exports.createPremiumContentSchema = zod_1.z.object({
    body: premiumContentBody,
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.updatePremiumContentSchema = zod_1.z.object({
    body: premiumContentBody.partial(),
    params: zod_1.z.object({
        contentId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
exports.contentIdParamsSchema = zod_1.z.object({
    body: zod_1.z.object({}).default({}),
    params: zod_1.z.object({
        contentId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
