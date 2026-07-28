import { describe, it, expect } from 'vitest';
import { getI18nValue, convertToUSD, convertToDOP } from '../types';
import {
  hasPermission,
  canAccess,
  isStaffRole,
  isOfficeStaffRole,
  isDeliveryRole,
  isDeliveryAssignableRole,
  canAccessAdminNav,
  isAdminNavHidden,
  canUseStoreAccount,
} from '../rbac';

describe('getI18nValue', () => {
  it('returns locale value when present', () => {
    expect(getI18nValue({ es: 'Hola', en: 'Hello' }, 'en')).toBe('Hello');
  });

  it('falls back to es then en', () => {
    expect(getI18nValue({ es: 'Hola', en: '' }, 'en')).toBe('Hola');
  });
});

describe('currency conversion', () => {
  it('converts DOP to USD', () => {
    expect(convertToUSD(585, 58.5)).toBe(10);
  });

  it('converts USD to DOP', () => {
    expect(convertToDOP(10, 58.5)).toBe(585);
  });
});

describe('RBAC', () => {
  it('super_admin has full access', () => {
    expect(hasPermission('super_admin', 'users:delete')).toBe(true);
  });

  it('cliente can only create/read orders', () => {
    expect(canAccess('cliente', 'orders', 'create')).toBe(true);
    expect(canAccess('cliente', 'products', 'delete')).toBe(false);
  });

  it('delivery is staff but not office staff', () => {
    expect(isStaffRole('delivery')).toBe(true);
    expect(isOfficeStaffRole('delivery')).toBe(false);
    expect(isDeliveryRole('delivery')).toBe(true);
    expect(isOfficeStaffRole('operador')).toBe(true);
  });

  it('admin nav: operador y marketing ven secciones distintas', () => {
    expect(canAccessAdminNav('operador', 'orders')).toBe(true);
    expect(canAccessAdminNav('operador', 'reviews')).toBe(false);
    expect(canAccessAdminNav('marketing', 'reviews')).toBe(true);
    expect(canAccessAdminNav('marketing', 'orders')).toBe(false);
    expect(canAccessAdminNav('cliente', 'users')).toBe(false);
    expect(isAdminNavHidden('delivery', 'settings')).toBe(true);
  });

  it('store account: staff y cliente pueden usar la tienda', () => {
    expect(canUseStoreAccount('cliente')).toBe(true);
    expect(canUseStoreAccount('marketing')).toBe(true);
    expect(canUseStoreAccount('delivery')).toBe(true);
    expect(canUseStoreAccount('super_admin')).toBe(true);
    expect(canUseStoreAccount(null)).toBe(false);
  });
});
