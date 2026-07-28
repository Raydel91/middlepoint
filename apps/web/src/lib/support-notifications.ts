import type { Payload } from 'payload';

type SupportDoc = {
  id: string | number;
  subject?: string | null;
  user?: unknown;
  order?: unknown;
  admin_reply?: string | null;
  thread?: Array<{ role?: string | null; body?: string | null }> | null;
};

function getRelationId(value: unknown): string | number | null {
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return (value as { id: string | number }).id;
  }
  if (typeof value === 'string' || typeof value === 'number') return value;
  return null;
}

export function hasNewStaffReply(previous: SupportDoc | null | undefined, current: SupportDoc) {
  const reply = current.admin_reply?.trim();
  const prevReply = previous?.admin_reply?.trim();
  const prevThread = Array.isArray(previous?.thread) ? previous.thread : [];
  const newThread = Array.isArray(current.thread) ? current.thread : [];

  const adminReplyChanged = Boolean(reply && reply !== prevReply);
  const staffThreadAdded =
    newThread.length > prevThread.length &&
    newThread.slice(prevThread.length).some((e) => e.role === 'staff' && e.body?.trim());

  return adminReplyChanged || staffThreadAdded;
}

export async function notifyCustomerOfSupportReply(
  payload: Payload,
  doc: SupportDoc,
  previousDoc?: SupportDoc | null,
) {
  if (!hasNewStaffReply(previousDoc, doc)) return;

  const userId = getRelationId(doc.user);
  if (!userId) return;
  const userIdNum = Number(userId);
  if (!Number.isFinite(userIdNum)) return;

  const orderId = getRelationId(doc.order);
  let locale: 'es' | 'en' = 'es';

  if (orderId) {
    try {
      const order = await payload.findByID({
        collection: 'orders',
        id: orderId,
        depth: 0,
        overrideAccess: true,
      });
      locale = order.customer_locale === 'en' ? 'en' : 'es';
    } catch {
      locale = 'es';
    }
  }

  const isEs = locale === 'es';

  await payload.create({
    collection: 'customer-notifications',
    data: {
      user: userIdNum,
      order: orderId ? Number(orderId) : undefined,
      support_message: Number(doc.id),
      type: 'message_reply',
      title: isEs ? `Respuesta: ${doc.subject}` : `Reply: ${doc.subject}`,
      body: isEs
        ? 'Tienes una nueva respuesta del equipo. Abre el mensaje para leerla.'
        : 'You have a new reply from our team. Open the message to read it.',
      read: false,
    },
    overrideAccess: true,
  });
}
