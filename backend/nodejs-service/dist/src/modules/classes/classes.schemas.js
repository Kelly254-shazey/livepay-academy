"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lessonAccessParamsSchema = exports.classIdParamsSchema = exports.addLessonSchema = exports.updateClassSchema = exports.createClassSchema = void 0;
const zod_1 = require("zod");
const classBody = zod_1.z.object({
    categoryId: zod_1.z.string().uuid().optional(),
    title: zod_1.z.string().min(3).max(180),
    description: zod_1.z.string().max(4000).optional(),
    price: zod_1.z.coerce.number().min(0).default(0),
    currency: zod_1.z.string().length(3).default("USD"),
    isPaid: zod_1.z.boolean().default(true),
    startsAt: zod_1.z.string().datetime().optional(),
    endsAt: zod_1.z.string().datetime().optional()
});
exports.createClassSchema = zod_1.z.object({
    body: classBody,
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.updateClassSchema = zod_1.z.object({
    body: classBody.partial(),
    params: zod_1.z.object({
        classId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
exports.addLessonSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(2).max(180),
        description: zod_1.z.string().max(4000).optional(),
        orderIndex: zod_1.z.coerce.number().int().min(1),
        isPreview: zod_1.z.boolean().default(false),
        assetUrl: zod_1.z.string().url().optional(),
        scheduledFor: zod_1.z.string().datetime().optional()
    }),
    params: zod_1.z.object({
        classId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
exports.classIdParamsSchema = zod_1.z.object({
    body: zod_1.z.object({}).default({}),
    params: zod_1.z.object({
        classId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
exports.lessonAccessParamsSchema = zod_1.z.object({
    body: zod_1.z.object({}).default({}),
    params: zod_1.z.object({
        classId: zod_1.z.string().uuid(),
        lessonId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
