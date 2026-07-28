import type { Payload } from 'payload';
import type { OrderStatus } from '@middlepoint/shared';

const STATUS_COPY: Record<OrderStatus, { es: { title: string; body: string }; en: { title: string; body: string } }> = {
  pending: {
    es: {
      title: 'Pedido recibido',
      body: 'Tu pedido fue registrado y está pendiente de confirmación.',
    },
    en: {
      title: 'Order received',
      body: 'Your order was placed and is pending confirmation.',
    },
  },
  confirmed: {
    es: {
      title: 'Pedido confirmado',
      body: 'Tu pedido fue confirmado. Pronto comenzaremos a prepararlo.',
    },
    en: {
      title: 'Order confirmed',
      body: 'Your order was confirmed. We will start preparing it soon.',
    },
  },
  preparing: {
    es: {
      title: 'Pedido en preparación',
      body: 'Estamos preparando tu pedido.',
    },
    en: {
      title: 'Order in preparation',
      body: 'We are preparing your order.',
    },
  },
  ready: {
    es: {
      title: 'Pedido listo',
      body: 'Tu pedido está listo para entrega o recogida.',
    },
    en: {
      title: 'Order ready',
      body: 'Your order is ready for delivery or pickup.',
    },
  },
  in_transit: {
    es: {
      title: 'Pedido en camino',
      body: 'Tu pedido va en camino hacia tu dirección.',
    },
    en: {
      title: 'Order on the way',
      body: 'Your order is on its way to your address.',
    },
  },
  delivered: {
    es: {
      title: 'Pedido entregado',
      body: 'Tu pedido fue entregado. ¡Gracias por tu compra!',
    },
    en: {
      title: 'Order delivered',
      body: 'Your order was delivered. Thank you for your purchase!',
    },
  },
  returned: {
    es: {
      title: 'Pedido devuelto',
      body: 'Tu pedido fue marcado como devuelto. Si tienes dudas, contáctanos.',
    },
    en: {
      title: 'Order returned',
      body: 'Your order was marked as returned. Contact us if you have questions.',
    },
  },
  cancelled: {
    es: {
      title: 'Pedido cancelado',
      body: 'Tu pedido fue cancelado. Si tienes dudas, contáctanos.',
    },
    en: {
      title: 'Order cancelled',
      body: 'Your order was cancelled. Contact us if you have questions.',
    },
  },
};

export function getOrderStatusCopy(status: OrderStatus, locale: 'es' | 'en' = 'es') {
  return STATUS_COPY[status][locale];
}

function formatOrderReference(orderId: string | number, locale: 'es' | 'en') {
  return locale === 'es' ? `(Pedido #${orderId})` : `(Order #${orderId})`;
}

export async function notifyOrderStatusChange(
  payload: Payload,
  {
    userId,
    orderId,
    status,
    locale = 'es',
    supportMessageId,
  }: {
    userId: string | number;
    orderId: string | number;
    status: OrderStatus;
    locale?: 'es' | 'en';
    cancellationReason?: string | null;
    supportMessageId?: string | number | null;
  },
) {
  const numericUserId = Number(userId);
  if (!Number.isFinite(numericUserId)) return;

  const copy = getOrderStatusCopy(status, locale);
  const ref = formatOrderReference(orderId, locale);

  let body = `${copy.body} ${ref}`;
  if (status === 'cancelled' && supportMessageId) {
    body =
      locale === 'es'
        ? `Tu pedido fue cancelado. Revisa el mensaje para más detalles. ${ref}`
        : `Your order was cancelled. See the message for details. ${ref}`;
  }

  await payload.create({
    collection: 'customer-notifications',
    data: {
      user: numericUserId,
      order: Number(orderId),
      support_message: supportMessageId ? Number(supportMessageId) : undefined,
      type: 'order_status',
      title: copy.title,
      body,
      read: false,
    },
    overrideAccess: true,
  });
}
