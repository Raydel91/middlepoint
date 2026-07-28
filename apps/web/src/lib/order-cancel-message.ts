import type { Payload } from 'payload';
import { findExistingClientChat } from '@/lib/support-chat-service';

export async function createCancellationSupportMessage(
  payload: Payload,
  {
    userId,
    orderId,
    reason,
    locale = 'es',
  }: {
    userId: number;
    orderId: number;
    reason: string;
    locale?: 'es' | 'en';
  },
) {
  const isEs = locale === 'es';
  const subject = isEs ? `Pedido #${orderId}` : `Order #${orderId}`;
  const staffBody = reason.trim();
  const now = new Date().toISOString();

  const existing = await findExistingClientChat(payload, userId);

  if (existing) {
    const thread = Array.isArray(existing.thread) ? existing.thread : [];
    const updateData: Record<string, unknown> = {
      order: orderId,
      status: 'responded',
      read_by_customer: false,
      thread: [
        ...thread,
        {
          role: 'staff',
          body: isEs
            ? `Cancelación del pedido #${orderId}: ${staffBody}`
            : `Cancellation of order #${orderId}: ${staffBody}`,
          sent_at: now,
        },
      ],
    };

    if (!existing.admin_reply?.trim()) {
      updateData.admin_reply = staffBody;
    }

    return payload.update({
      collection: 'support-messages',
      id: existing.id,
      data: updateData,
      overrideAccess: true,
    });
  }

  return payload.create({
    collection: 'support-messages',
    data: {
      user: userId,
      order: orderId,
      source: 'staff_order_cancel',
      subject,
      message: isEs
        ? 'El equipo te contactó sobre tu pedido.'
        : 'Our team reached out about your order.',
      admin_reply: staffBody,
      status: 'responded',
      read_by_customer: false,
    },
    overrideAccess: true,
  });
}
