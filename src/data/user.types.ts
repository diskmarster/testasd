import { z } from "zod";

export const userRoleZodSchema = z.enum(['læseadgang', 'afgang', 'bruger', 'moderator', 'administrator', 'system_administrator']);
export type UserRole = z.infer<typeof userRoleZodSchema>;
export const userRoles = userRoleZodSchema.options as readonly UserRole[];


export function hasPermissionByRank(userRole: UserRole, requiredRole: UserRole): boolean {
  const userRank = userRoles.indexOf(userRole);
  const requiredRank = userRoles.indexOf(requiredRole);

  return userRank >= requiredRank;
}

export type UserRoleFilter = {
  op: 'lt' | 'le' | 'eq' | 'gt' | 'ge',
  role: UserRole
}

type FilterFn<T> = (val: T) => boolean
type UserRoleFilterFn = FilterFn<UserRole>

export function getUserRoles(filter?: UserRoleFilter): UserRole[] {
  if (!filter) {
    return userRoles as UserRole[]
  }

  return userRoles.filter(getUserRoleFilterFn(filter))
}

function getUserRoleFilterFn(filter: UserRoleFilter): UserRoleFilterFn {
  const requiredRank = userRoles.indexOf(filter.role);

  switch (filter.op) {
    case 'lt':
      return (val: UserRole) => {
        const userRank = userRoles.indexOf(val);

        return userRank < requiredRank
      }
    case 'le':
      return (val: UserRole) => {
        const userRank = userRoles.indexOf(val);

        return userRank <= requiredRank
      }
    case 'gt':
      return (val: UserRole) => {
        const userRank = userRoles.indexOf(val);

        return userRank > requiredRank
      }
    case 'ge':
      return (val: UserRole) => {
        const userRank = userRoles.indexOf(val);

        return userRank >= requiredRank
      }
    case 'eq':
      return (val: UserRole) => {
        const userRank = userRoles.indexOf(val);

        return userRank == requiredRank
      }
  }
}
