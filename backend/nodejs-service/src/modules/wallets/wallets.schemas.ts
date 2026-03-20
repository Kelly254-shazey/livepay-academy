import { z } from "zod";

export const requestPayoutSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive(),
    currency: z.string().length(3).default("USD")
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({})
});

