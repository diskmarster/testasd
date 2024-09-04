import { z } from "zod";

export const planZodSchema = z.enum(['lite', 'plus', 'pro']);
export type Plan = z.infer<typeof planZodSchema>;
export const plans = planZodSchema.options as readonly Plan[];
