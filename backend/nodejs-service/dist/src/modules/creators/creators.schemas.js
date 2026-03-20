"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.creatorHandleParamsSchema = exports.upsertCreatorProfileSchema = void 0;
const zod_1 = require("zod");
exports.upsertCreatorProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        handle: zod_1.z.string().min(3).max(40).regex(/^[a-z0-9-]+$/),
        displayName: zod_1.z.string().min(2).max(120),
        headline: zod_1.z.string().max(140).optional(),
        bio: zod_1.z.string().max(1000).optional(),
        focusCategories: zod_1.z.array(zod_1.z.string()).max(5).default([])
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.creatorHandleParamsSchema = zod_1.z.object({
    body: zod_1.z.object({}).default({}),
    params: zod_1.z.object({
        handle: zod_1.z.string().min(3).max(40)
    }),
    query: zod_1.z.object({}).default({})
});
