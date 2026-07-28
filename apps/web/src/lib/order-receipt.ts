import { formatCurrency, type Currency, type Locale } from '@middlepoint/shared';
import type { BankAccount } from '@/lib/store-content';

export type OrderReceiptItem = {
  name: string;
  quantity: number;
  price: number;
};

export type OrderReceiptAddress = {
  street?: string;
  city?: string;
  province?: string;
  reference?: string;
};

export type OrderReceiptData = {
  orderId: string | number;
  locale: Locale;
  currency: Currency;
  total: number;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: 'cash' | 'transfer' | string;
  paymentAccount?: BankAccount | null;
  items: OrderReceiptItem[];
  address?: OrderReceiptAddress | null;
  scheduledDate?: string | null;
  scheduledTime?: string | null;
};

function formatAddress(address?: OrderReceiptAddress | null): string {
  if (!address) return '';
  return [
    address.street,
    [address.city, address.province].filter(Boolean).join(', '),
    address.reference,
  ]
    .filter((part) => part && part.trim())
    .join(' · ');
}

/**
 * Construye el texto del comprobante que el cliente enviará por WhatsApp al
 * número de confirmación de pedidos. Se localiza según el idioma del pedido.
 */
export function buildOrderReceiptMessage(data: OrderReceiptData): string {
  const isEs = data.locale !== 'en';
  const c = (amount: number) => formatCurrency(amount, data.currency, data.locale);

  const lines: string[] = [];

  lines.push(isEs ? `🧾 *Comprobante de pedido #${data.orderId}*` : `🧾 *Order receipt #${data.orderId}*`);
  lines.push('MiddlePoint');
  lines.push('');

  if (data.customerName) {
    lines.push(isEs ? `Cliente: ${data.customerName}` : `Customer: ${data.customerName}`);
  }
  if (data.customerPhone) {
    lines.push(isEs ? `Teléfono: ${data.customerPhone}` : `Phone: ${data.customerPhone}`);
  }

  lines.push('');
  lines.push(isEs ? '*Productos:*' : '*Items:*');
  for (const item of data.items) {
    lines.push(`• ${item.quantity}x ${item.name} — ${c(item.price * item.quantity)}`);
  }

  lines.push('');
  lines.push(isEs ? `*Total: ${c(data.total)}*` : `*Total: ${c(data.total)}*`);

  const paymentLabel =
    data.paymentMethod === 'transfer'
      ? isEs
        ? 'Transferencia'
        : 'Bank transfer'
      : isEs
        ? 'Efectivo'
        : 'Cash';
  lines.push(isEs ? `Pago: ${paymentLabel}` : `Payment: ${paymentLabel}`);

  if (data.paymentMethod === 'transfer' && data.paymentAccount?.accountNumber?.trim()) {
    const acc = data.paymentAccount;
    const accSummary = [acc.bankName, acc.currency, acc.accountTypeLabel, acc.accountNumber]
      .filter(Boolean)
      .join(' · ');
    lines.push(isEs ? `Cuenta: ${accSummary}` : `Account: ${accSummary}`);
  }

  const addressText = formatAddress(data.address);
  if (addressText) {
    lines.push('');
    lines.push(isEs ? `Entrega: ${addressText}` : `Delivery: ${addressText}`);
  }

  if (data.scheduledDate?.trim() || data.scheduledTime?.trim()) {
    const when = [data.scheduledDate, data.scheduledTime].filter((v) => v && v.trim()).join(' ');
    lines.push(isEs ? `Fecha/hora: ${when}` : `Date/time: ${when}`);
  }

  lines.push('');
  lines.push(
    isEs
      ? 'Adjunto el comprobante de pago. ¡Gracias!'
      : 'I am attaching the payment receipt. Thank you!',
  );

  return lines.join('\n');
}

/**
 * Versión en texto plano (sin emojis ni markdown) para generar el PDF del
 * comprobante. Devuelve un título y las líneas del cuerpo.
 */
export function buildOrderReceiptDocument(data: OrderReceiptData): {
  title: string;
  lines: string[];
} {
  const isEs = data.locale !== 'en';
  const c = (amount: number) => formatCurrency(amount, data.currency, data.locale);

  const title = isEs ? `Comprobante de pedido #${data.orderId}` : `Order receipt #${data.orderId}`;
  const lines: string[] = ['MiddlePoint', ''];

  if (data.customerName) {
    lines.push(isEs ? `Cliente: ${data.customerName}` : `Customer: ${data.customerName}`);
  }
  if (data.customerPhone) {
    lines.push(isEs ? `Telefono: ${data.customerPhone}` : `Phone: ${data.customerPhone}`);
  }

  lines.push('');
  lines.push(isEs ? 'Productos:' : 'Items:');
  for (const item of data.items) {
    lines.push(`- ${item.quantity}x ${item.name}  ${c(item.price * item.quantity)}`);
  }

  lines.push('');
  lines.push(isEs ? `Total: ${c(data.total)}` : `Total: ${c(data.total)}`);

  const paymentLabel =
    data.paymentMethod === 'transfer'
      ? isEs
        ? 'Transferencia'
        : 'Bank transfer'
      : isEs
        ? 'Efectivo'
        : 'Cash';
  lines.push(isEs ? `Pago: ${paymentLabel}` : `Payment: ${paymentLabel}`);

  if (data.paymentMethod === 'transfer' && data.paymentAccount?.accountNumber?.trim()) {
    const acc = data.paymentAccount;
    const accSummary = [acc.bankName, acc.currency, acc.accountTypeLabel, acc.accountNumber]
      .filter(Boolean)
      .join(' - ');
    lines.push(isEs ? `Cuenta: ${accSummary}` : `Account: ${accSummary}`);
  }

  const addressText = formatAddress(data.address);
  if (addressText) {
    lines.push('');
    lines.push(isEs ? `Entrega: ${addressText}` : `Delivery: ${addressText}`);
  }

  if (data.scheduledDate?.trim() || data.scheduledTime?.trim()) {
    const when = [data.scheduledDate, data.scheduledTime].filter((v) => v && v.trim()).join(' ');
    lines.push(isEs ? `Fecha/hora: ${when}` : `Date/time: ${when}`);
  }

  return { title, lines };
}
