/**
 * Profile Settings Schemas
 * Validation for user profile updates with Facebook-style fields
 */

import { z } from "zod";

export const profileUpdateBodySchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional().nullable(),
  website: z
    .string()
    .url()
    .max(255)
    .optional()
    .nullable()
    .or(z.literal("")),
  location: z.string().max(255).optional().nullable(),
  profilePhotoUrl: z
    .string()
    .url()
    .max(500)
    .optional()
    .nullable()
    .or(z.literal("")),
  coverPhotoUrl: z
    .string()
    .url()
    .max(500)
    .optional()
    .nullable()
    .or(z.literal("")),
});

export const creatorProfileUpdateBodySchema = profileUpdateBodySchema.extend({
  headline: z.string().max(150).optional().nullable(),
  displayName: z.string().min(1).max(100).optional(),
  socialLinks: z
    .object({
      twitter: z.string().url().optional().nullable(),
      linkedin: z.string().url().optional().nullable(),
      instagram: z.string().url().optional().nullable(),
      youtube: z.string().url().optional().nullable(),
      github: z.string().url().optional().nullable(),
      website: z.string().url().optional().nullable(),
    })
    .optional()
    .nullable(),
  focusCategories: z.array(z.string()).optional(),
});

export const profileUpdateSchema = z.object({
  body: profileUpdateBodySchema,
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export const creatorProfileUpdateSchema = z.object({
  body: creatorProfileUpdateBodySchema,
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateBodySchema>;
export type CreatorProfileUpdateInput = z.infer<typeof creatorProfileUpdateBodySchema>;
