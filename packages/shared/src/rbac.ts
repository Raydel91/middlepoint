import type { PermissionAction, UserRole } from './types';

export type PermissionResource =
  | 'users'
  | 'products'
  | 'categories'
  | 'orders'
  | 'deliveries'
  | 'analytics'
  | 'settings'
  | 'marketing';

export type Permission = `${PermissionResource}:${PermissionAction}`;

const ALL_ACTIONS: PermissionAction[] = ['create', 'read', 'update', 'delete'];

function buildPermissions(
  resources: PermissionResource[],
  actions: PermissionAction[] = ALL_ACTIONS,
): Permission[] {
  return resources.flatMap((resource) =>
    actions.map((action) => `${resource}:${action}` as Permission),
  );
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: buildPermissions([
    'users',
    'products',
    'categories',
    'orders',
    'deliveries',
    'analytics',
    'settings',
    'marketing',
  ]),
  operador: buildPermissions(
    ['products', 'categories', 'orders', 'deliveries'],
    ['read', 'update'],
  ),
  marketing: buildPermissions(
    ['products', 'categories', 'analytics', 'marketing'],
    ['create', 'read', 'update'],
  ),
  cliente: buildPermissions(['orders'], ['create', 'read']),
  delivery: buildPermissions(['orders', 'deliveries'], ['read', 'update']),
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAccess(role: UserRole, resource: PermissionResource, action: PermissionAction): boolean {
  return hasPermission(role, `${resource}:${action}`);
}

export function isStaffRole(role: UserRole): boolean {
  return role !== 'cliente';
}

export function isAdminRole(role: UserRole): boolean {
  return role === 'super_admin';
}
