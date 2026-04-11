"use strict";
/**
 * Profile Settings Schemas
 * Validation for user profile updates with Facebook-style fields
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.creatorProfileUpdateSchema = exports.profileUpdateSchema = exports.creatorProfileUpdateBodySchema = exports.profileUpdateBodySchema = void 0;
const zod_1 = require("zod");
exports.profileUpdateBodySchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(100).optional(),
    lastName: zod_1.z.string().min(1).max(100).optional(),
    bio: zod_1.z.string().max(500).optional().nullable(),
    website: zod_1.z
        .string()
        .url()
        .max(255)
        .optional()
        .nullable()
        .or(zod_1.z.literal("")),
    location: zod_1.z.string().max(255).optional().nullable(),
    profilePhotoUrl: zod_1.z
        .string()
        .url()
        .max(500)
        .optional()
        .nullable()
        .or(zod_1.z.literal("")),
    coverPhotoUrl: zod_1.z
        .string()
        .url()
        .max(500)
        .optional()
        .nullable()
        .or(zod_1.z.literal("")),
});
exports.creatorProfileUpdateBodySchema = exports.profileUpdateBodySchema.extend({
    headline: zod_1.z.string().max(150).optional().nullable(),
    displayName: zod_1.z.string().min(1).max(100).optional(),
    socialLinks: zod_1.z
        .object({
        twitter: zod_1.z.string().url().optional().nullable(),
        linkedin: zod_1.z.string().url().optional().nullable(),
        instagram: zod_1.z.string().url().optional().nullable(),
        youtube: zod_1.z.string().url().optional().nullable(),
        github: zod_1.z.string().url().optional().nullable(),
        website: zod_1.z.string().url().optional().nullable(),
    })
        .optional()
        .nullable(),
    focusCategories: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.profileUpdateSchema = zod_1.z.object({
    body: exports.profileUpdateBodySchema,
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.creatorProfileUpdateSchema = zod_1.z.object({
    body: exports.creatorProfileUpdateBodySchema,
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
