import type { Payload } from 'payload';

function formatOrderReference(orderId: string | number, locale: 'es' | 'en') {
  return locale === 'es' ? `(Pedido #${orderId})` : `(Order #${orderId})`;
}

export async function notifyOrderRescheduled(
  payload: Payload,
  {
    userId,
    orderId,
    locale = 'es',
    scheduledDate,
    scheduledTime,
  }: {
    userId: string | number;
    orderId: string | number;
    locale?: 'es' | 'en';
    scheduledDate?: string | null;
    scheduledTime?: string | null;
  },
) {
  const numericUserId = Number(userId);
  if (!Number.isFinite(numericUserId)) return;

  const date = scheduledDate?.trim() || '—';
  const time = scheduledTime?.trim() || '—';
  const isEs = locale === 'es';

  const title = isEs ? 'Entrega reagendada' : 'Delivery rescheduled';
  const body = isEs
    ? `Tu pedido fue reagendado para el ${date} a las ${time}.`
    : `Your order was rescheduled to ${date} at ${time}.`;

  await payload.create({
    collection: 'customer-notifications',
    data: {
      user: numericUserId,
      order: Number(orderId),
      type: 'order_status',
      title,
      body: `${body} ${formatOrderReference(orderId, locale)}`,
      read: false,
    },
    overrideAccess: true,
  });
}
