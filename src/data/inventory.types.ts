import { z } from "zod";

export const historyTypeZodSchema = z.enum(['tilgang', 'afgang', 'regulering']);
export type HistoryType = z.infer<typeof historyTypeZodSchema>;
export const historyTypes = historyTypeZodSchema.options as readonly HistoryType[];
