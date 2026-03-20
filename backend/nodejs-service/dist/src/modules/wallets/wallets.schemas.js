"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestPayoutSchema = void 0;
const zod_1 = require("zod");
exports.requestPayoutSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z.coerce.number().positive(),
        currency: zod_1.z.string().length(3).default("USD")
    }),
    params: zod_1.z.object({}).default({}),
    query: zod_1.z.object({}).default({})
});
