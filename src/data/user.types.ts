import { z } from "zod";

export const userRoleZodSchema = z.enum(['system_administrator', 'admininstrator', 'moderator', 'bruger', 'afgang', 'læseadgang']);
export type UserRole = z.infer<typeof userRoleZodSchema>;
export const userRoles = userRoleZodSchema.options as readonly UserRole[];
