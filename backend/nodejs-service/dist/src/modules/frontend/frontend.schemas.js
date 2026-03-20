"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutRequestSchema = exports.checkoutSchema = exports.searchQuerySchema = exports.classIdParamsSchema = exports.contentIdParamsSchema = exports.liveIdParamsSchema = exports.creatorIdParamsSchema = exports.categorySlugParamsSchema = exports.frontendResetPasswordSchema = exports.frontendForgotPasswordSchema = exports.frontendSignUpSchema = exports.frontendSignInSchema = void 0;
const zod_1 = require("zod");
exports.frontendSignInSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8).max(72),
        role: zod_1.z.enum(["viewer", "creator", "moderator", "admin"]).default("viewer")
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
exports.frontendSignUpSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(2).max(160),
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(8).max(72),
        role: zod_1.z.enum(["viewer", "creator"]).default("viewer")
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
        token: zod_1.z.string().min(12),
        password: zod_1.z.string().min(8).max(72)
    }),
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
        method: zod_1.z.string().min(2).max(120),
        note: zod_1.z.string().max(500).optional()
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
