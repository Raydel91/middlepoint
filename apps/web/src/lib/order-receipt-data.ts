import type { Payload } from 'payload';
import {
  getI18nValue,
  type Currency,
  type I18nField,
  type Locale,
} from '@middlepoint/shared';
import type { BankAccount } from '@/lib/store-content';
import type { OrderReceiptData, OrderReceiptItem } from '@/lib/order-receipt';

type ContactJson = { name?: string; phone?: string; email?: string };
type AddressJson = { street?: string; city?: string; province?: string; reference?: string };

import type { Order } from '@/payload-types';

/**
 * Construye los datos del comprobante a partir de un pedido de Payload.
 * Reutilizado por la página de éxito del checkout y la descarga desde "Mis pedidos".
 */
export async function buildOrderReceiptDataFromOrder(
  payload: Payload,
  order: Order,
  fallbackLocale: Locale,
): Promise<OrderReceiptData> {
  const paymentMethod = (order.payment_method as 'cash' | 'transfer') || 'cash';
  const chosenAccount =
    order.payment_account && typeof order.payment_account === 'object'
      ? (order.payment_account as BankAccount)
      : null;

  const orderTotal = typeof order.total === 'number' ? order.total : 0;
  const orderCurrency = (order.currency as Currency) || 'DOP';
  const receiptLocale = (order.customer_locale as Locale) || fallbackLocale;

  const itemsResult = await payload.find({
    collection: 'order-items',
    where: { order: { equals: order.id } },
    depth: 1,
    limit: 100,
    overrideAccess: true,
  });

  const items: OrderReceiptItem[] = itemsResult.docs.map((doc) => {
    const product = doc.product as { nombre?: I18nField | null } | number | null;
    const name =
      product && typeof product === 'object'
        ? getI18nValue(product.nombre ?? null, receiptLocale)
        : `#${String(doc.product)}`;
    return {
      name: name || 'Producto',
      quantity: Number(doc.quantity) || 0,
      price: Number(doc.price) || 0,
    };
  });

  const contact = (order.contact_primary as ContactJson | undefined) || undefined;
  const address = (order.address as AddressJson | undefined) || undefined;

  return {
    orderId: order.id,
    locale: receiptLocale,
    currency: orderCurrency,
    total: orderTotal,
    customerName: contact?.name,
    customerPhone: contact?.phone,
    paymentMethod,
    paymentAccount: chosenAccount,
    items,
    address,
    scheduledDate: (order.scheduled_date as string | null) ?? null,
    scheduledTime: (order.scheduled_time as string | null) ?? null,
  };
}
