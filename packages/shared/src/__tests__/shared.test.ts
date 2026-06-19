import { describe, it, expect } from 'vitest';
import { getI18nValue, convertToUSD, convertToDOP } from '../types';
import { hasPermission, canAccess } from '../rbac';

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
});
