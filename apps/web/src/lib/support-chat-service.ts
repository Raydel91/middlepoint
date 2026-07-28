import type { Payload } from 'payload';
import { DEFAULT_CHAT_SUBJECT } from '@/lib/support-message-delete';

export async function findExistingClientChat(payload: Payload, userId: number) {
  const result = await payload.find({
    collection: 'support-messages',
    where: { user: { equals: userId } },
    sort: '-updatedAt',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });

  return result.docs[0] ?? null;
}

export async function createClientChat(
  payload: Payload,
  {
    userId,
    subject = DEFAULT_CHAT_SUBJECT,
    source = 'customer',
  }: {
    userId: number;
    subject?: string;
    source?: 'customer' | 'staff_initiated' | 'staff_order_cancel';
  },
) {
  const existing = await findExistingClientChat(payload, userId);
  if (existing) return { chat: existing, created: false as const };

  const chat = await payload.create({
    collection: 'support-messages',
    data: {
      user: userId,
      subject,
      message: '',
      status: 'received',
      source,
      read_by_customer: source === 'customer',
    },
    overrideAccess: true,
  });

  return { chat, created: true as const };
}

export async function sendCustomerSupportMessage(
  payload: Payload,
  userId: number,
  message: string,
) {
  const trimmed = message.trim();
  const existing = await findExistingClientChat(payload, userId);
  const now = new Date().toISOString();
  const entry = {
    role: 'customer' as const,
    body: trimmed,
    sent_at: now,
    deleted_for_customer: false,
    deleted_for_staff: false,
  };

  if (!existing) {
    return payload.create({
      collection: 'support-messages',
      data: {
        user: userId,
        subject: DEFAULT_CHAT_SUBJECT,
        message: '',
        status: 'received',
        source: 'customer',
        read_by_customer: true,
        thread: [entry],
      },
      overrideAccess: true,
    });
  }

  const existingThread = Array.isArray(existing.thread) ? existing.thread : [];

  return payload.update({
    collection: 'support-messages',
    id: existing.id,
    data: {
      status: 'received',
      read_by_customer: true,
      thread: [...existingThread, entry],
    },
    overrideAccess: true,
  });
}
