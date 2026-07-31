import { ROLES, type PermissionAction, type UserRole } from './types';

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

/** Entidades visibles en el menú del panel admin. */
export type AdminNavKey =
  | 'users'
  | 'settings'
  | 'orders'
  | 'order-items'
  | 'deliveries'
  | 'customer-notifications'
  | 'support-messages'
  | 'reviews'
  | 'store-content'
  | 'products'
  | 'categories'
  | 'media'
  | 'tracking-events';

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
    ['users', 'orders', 'deliveries', 'settings'],
    ['read', 'update'],
  ),
  marketing: buildPermissions(
    ['users', 'marketing', 'products', 'categories'],
    ['read', 'update'],
  ),
  cliente: buildPermissions(['orders'], ['create', 'read']),
  delivery: buildPermissions(['orders', 'deliveries'], ['read', 'update']),
};

/** Menú admin permitido por rol (además del dashboard). */
const ADMIN_NAV_BY_ROLE: Record<UserRole, AdminNavKey[] | 'all'> = {
  super_admin: 'all',
  operador: [
    'users',
    'settings',
    'orders',
    'order-items',
    'deliveries',
    'customer-notifications',
    'support-messages',
  ],
  marketing: ['users', 'reviews', 'store-content', 'products', 'categories', 'media'],
  delivery: ['users', 'orders'],
  cliente: [],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAccess(role: UserRole, resource: PermissionResource, action: PermissionAction): boolean {
  return hasPermission(role, `${resource}:${action}`);
}

export function isStaffRole(role: UserRole | null | undefined): boolean {
  return !!role && role !== 'cliente';
}

/** Roles que pueden usar la tienda como cliente (cuenta, mensajes, pedidos propios). */
export function canUseStoreAccount(role: UserRole | null | undefined): boolean {
  return !!role && (ROLES as string[]).includes(role);
}

/** Personal de oficina (admin/operador/marketing). Excluye delivery y cliente. */
export function isOfficeStaffRole(role: UserRole | null | undefined): boolean {
  return !!role && isStaffRole(role) && role !== 'delivery';
}

export function isDeliveryRole(role: UserRole | null | undefined): boolean {
  return role === 'delivery';
}

export function isOperadorRole(role: UserRole | null | undefined): boolean {
  return role === 'operador';
}

export function isMarketingRole(role: UserRole | null | undefined): boolean {
  return role === 'marketing';
}

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === 'super_admin';
}

/** Roles que pueden asignarse como repartidor en un pedido. */
export const DELIVERY_ASSIGNABLE_ROLES: UserRole[] = [
  'delivery',
  'operador',
  'super_admin',
];

export function isDeliveryAssignableRole(role: UserRole | null | undefined): boolean {
  return !!role && (DELIVERY_ASSIGNABLE_ROLES as string[]).includes(role);
}

/** ¿El rol puede ver esta sección en el menú admin? */
export function canAccessAdminNav(
  role: UserRole | null | undefined,
  key: AdminNavKey,
): boolean {
  if (!role) return false;
  const allowed = ADMIN_NAV_BY_ROLE[role];
  if (!allowed) return false;
  if (allowed === 'all') return true;
  return allowed.includes(key);
}

/** Ocultar colección/global en el nav si el rol no tiene acceso. */
export function isAdminNavHidden(
  role: UserRole | null | undefined,
  key: AdminNavKey,
): boolean {
  return !canAccessAdminNav(role, key);
}
