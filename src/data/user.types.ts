import { z } from "zod";

export const userRoleZodSchema = z.enum(['sysadmin', 'admin', 'bruger']);
export type UserRole = z.infer<typeof userRoleZodSchema>;
export const userRoles = userRoleZodSchema.options as readonly UserRole[];
