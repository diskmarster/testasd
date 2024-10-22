import { z } from "zod";

export const userRoleZodSchema = z.enum(['læseadgang', 'afgang', 'bruger', 'moderator', 'administrator', 'system_administrator']);
export type UserRole = z.infer<typeof userRoleZodSchema>;
export const userRoles = userRoleZodSchema.options as readonly UserRole[];


export function hasPermissionByRank(userRole: UserRole, requiredRole: UserRole): boolean {
  const userRank = userRoles.indexOf(userRole);
  const requiredRank = userRoles.indexOf(requiredRole);

  return userRank >= requiredRank;
}

