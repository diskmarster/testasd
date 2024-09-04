import { z } from "zod";

export const userRoleZodSchema = z.enum(['sys_admin', 'firma_admin', 'lokal_admin', 'bruger']);
export type UserRole = z.infer<typeof userRoleZodSchema>;
export const userRoles = userRoleZodSchema.options as readonly UserRole[];
