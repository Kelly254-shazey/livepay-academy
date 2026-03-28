"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileSettingsSchema = exports.payoutRequestSchema = exports.checkoutSchema = exports.searchQuerySchema = exports.classIdParamsSchema = exports.contentIdParamsSchema = exports.liveIdParamsSchema = exports.creatorIdParamsSchema = exports.categorySlugParamsSchema = exports.emptyBodySchema = exports.frontendLinkPasswordSchema = exports.frontendCompleteProfileSchema = exports.frontendVerifyEmailSchema = exports.frontendResetPasswordSchema = exports.frontendForgotPasswordSchema = exports.frontendRefreshSchema = exports.frontendGoogleAuthSchema = exports.frontendSignUpSchema = exports.frontendSignInSchema = void 0;
const zod_1 = require("zod");
const usernameSchema = zod_1.z.string().trim().min(3).max(32);
const dateSchema = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.");
const genderSchema = zod_1.z.enum(["male", "female", "prefer_not_to_say", "custom"]);
const roleSchema = zod_1.z.enum(["viewer", "creator", "moderator", "admin"]);
const loginPasswordSchema = zod_1.z.string().min(1).max(256);
const passwordSchema = zod_1.z
    .string()
    .min(12)
    .max(72)
    .regex(/[a-z]/, "Password must include a lowercase letter.")
    .regex(/[A-Z]/, "Password must include an uppercase letter.")
    .regex(/\d/, "Password must include a number.")
    .regex(/[^A-Za-z0-9]/, "Password must include a symbol.");
exports.frontendSignInSchema = zod_1.z.object({
    body: zod_1.z.object({
        identifier: zod_1.z.string().trim().min(3).max(160),
        password: loginPasswordSchema
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.frontendSignUpSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(2).max(160),
        username: usernameSchema,
        email: zod_1.z.string().email(),
        password: passwordSchema,
        role: zod_1.z.enum(["viewer", "creator"]).default("viewer"),
        dateOfBirth: dateSchema,
        gender: genderSchema,
        customGender: zod_1.z.string().trim().max(80).optional()
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.frontendGoogleAuthSchema = zod_1.z.object({
    body: zod_1.z.object({
        idToken: zod_1.z.string().min(20),
        role: zod_1.z.enum(["viewer", "creator"]).default("viewer")
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.frontendRefreshSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1)
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.frontendForgotPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email()
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.frontendResetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        code: zod_1.z.string().trim().length(6),
        password: passwordSchema
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.frontendVerifyEmailSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        code: zod_1.z.string().trim().length(6)
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.frontendCompleteProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(2).max(160),
        username: usernameSchema,
        dateOfBirth: dateSchema,
        gender: genderSchema,
        customGender: zod_1.z.string().trim().max(80).optional()
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.frontendLinkPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        password: passwordSchema
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.emptyBodySchema = zod_1.z.object({
    body: zod_1.z.object({}).default({}),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.categorySlugParamsSchema = zod_1.z.object({
    body: zod_1.z.object({}).default({}),
    params: zod_1.z.object({
        slug: zod_1.z.string().min(2).max(120)
    }),
    query: zod_1.z.object({}).default({})
});
exports.creatorIdParamsSchema = zod_1.z.object({
    body: zod_1.z.object({}).default({}),
    params: zod_1.z.object({
        creatorId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
exports.liveIdParamsSchema = zod_1.z.object({
    body: zod_1.z.object({}).default({}),
    params: zod_1.z.object({
        liveId: zod_1.z.string().uuid()
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
exports.classIdParamsSchema = zod_1.z.object({
    body: zod_1.z.object({}).default({}),
    params: zod_1.z.object({
        classId: zod_1.z.string().uuid()
    }),
    query: zod_1.z.object({}).default({})
});
exports.searchQuerySchema = zod_1.z.object({
    body: zod_1.z.object({}).default({}),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({
        query: zod_1.z.string().trim().max(120).optional(),
        category: zod_1.z.string().trim().max(120).optional(),
        type: zod_1.z.enum(["creator", "live", "content", "class", "all"]).default("all")
    })
});
exports.checkoutSchema = zod_1.z.object({
    body: zod_1.z.object({
        productId: zod_1.z.string().uuid(),
        productType: zod_1.z.enum(["live", "content", "class"])
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.payoutRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z.coerce.number().positive(),
        method: zod_1.z
            .string()
            .trim()
            .min(2)
            .max(80)
            .regex(/^[a-zA-Z0-9 .,&()\/+-]+$/, "Payout method contains unsupported characters."),
        note: zod_1.z
            .string()
            .trim()
            .max(250)
            .regex(/^[^<>]*$/, "Payout note contains unsupported characters.")
            .optional()
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.profileSettingsSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().trim().min(2).max(160),
        email: zod_1.z.string().email(),
        roles: zod_1.z.array(roleSchema).min(1).max(4),
        defaultRole: roleSchema,
        notificationPreferences: zod_1.z.object({
            liveReminders: zod_1.z.boolean(),
            purchaseUpdates: zod_1.z.boolean(),
            creatorAnnouncements: zod_1.z.boolean(),
            systemAlerts: zod_1.z.boolean()
        }),
        appearancePreferences: zod_1.z.object({
            theme: zod_1.z.enum(["system", "light", "dark"]),
            compactMode: zod_1.z.boolean()
        }),
        privacyPreferences: zod_1.z.object({
            publicCreatorProfile: zod_1.z.boolean(),
            communityVisibility: zod_1.z.boolean()
        }),
        payoutPreferences: zod_1.z.object({
            method: zod_1.z
                .string()
                .trim()
                .min(2)
                .max(80)
                .regex(/^[a-zA-Z0-9 .,&()\/+-]+$/, "Payout method contains unsupported characters."),
            note: zod_1.z
                .string()
                .trim()
                .max(250)
                .regex(/^[^<>]*$/, "Payout note contains unsupported characters.")
                .optional()
        }).optional()
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
