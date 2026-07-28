export type Locale = 'es' | 'en';

export type I18nField = {
  es?: string | null;
  en?: string | null;
};

export type UserRole =
  | 'super_admin'
  | 'operador'
  | 'marketing'
  | 'cliente'
  | 'delivery';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'in_transit'
  | 'delivered'
  | 'returned'
  | 'cancelled';

export type DeliveryStatus = 'available' | 'busy' | 'offline';

export type PaymentMethod = 'cash' | 'transfer';

export type TrackingEvent =
  | 'view_product'
  | 'add_to_cart'
  | 'checkout_start'
  | 'purchase';

export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode?: string;
  reference?: string;
  lat?: number;
  lng?: number;
}

export interface Contact {
  name: string;
  phone: string;
  email?: string;
}

export interface ProductAttributes {
  isCombo?: boolean;
  comboItems?: string[];
  allergens?: string[];
  dietary?: string[];
  size?: string;
  [key: string]: unknown;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: I18nField;
}

export interface AnalyticsKPIs {
  totalSales: number;
  totalOrders: number;
  avgTicket: number;
  conversionRate: number;
  ltv: number;
  purchaseFrequency: number;
  totalClients: number;
  newClients: number;
  cac: number | null;
  marketingSpend: number;
}

export const ROLES: UserRole[] = [
  'super_admin',
  'operador',
  'marketing',
  'cliente',
  'delivery',
];

export const DEFAULT_LOCALE: Locale = 'es';
export const LOCALES: Locale[] = ['es', 'en'];
export const TIMEZONE = 'America/Santo_Domingo';
export const CURRENCIES = ['DOP', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

export function getI18nValue(field: I18nField | undefined | null, locale: Locale): string {
  if (!field) return '';
  return field[locale] || field.es || field.en || '';
}

export function formatCurrency(
  amount: number,
  currency: Currency = 'DOP',
  locale: Locale = 'es',
): string {
  const localeTag = locale === 'es' ? 'es-DO' : 'en-US';
  return new Intl.NumberFormat(localeTag, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function convertToUSD(amountDOP: number, exchangeRate: number): number {
  return Math.round((amountDOP / exchangeRate) * 100) / 100;
}

export function convertToDOP(amountUSD: number, exchangeRate: number): number {
  return Math.round(amountUSD * exchangeRate * 100) / 100;
}
