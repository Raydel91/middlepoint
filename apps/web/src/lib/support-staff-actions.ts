import type { Payload } from 'payload';
import { AppError } from '@/lib/logger';
import {
  applyDeleteAll,
  applyMessageDeletions,
  type DeleteScope,
} from '@/lib/support-message-delete';
import type { SupportThread } from '@/lib/support-chat';
import { createClientChat } from '@/lib/support-chat-service';
import { notifyCustomerOfSupportReply } from '@/lib/support-notifications';
export async function staffReplyToChat(
  payload: Payload,
  id: string | number,
  message: string,
) {
  const doc = await payload.findByID({
    collection: 'support-messages',
    id,
    overrideAccess: true,
  });

  const now = new Date().toISOString();
  const existingThread = Array.isArray(doc.thread) ? doc.thread : [];
  const trimmed = message.trim();

  const entry = {
    role: 'staff' as const,
    body: trimmed,
    sent_at: now,
    deleted_for_customer: false,
    deleted_for_staff: false,
  };

  const updated = await payload.update({
    collection: 'support-messages',
    id,
    data: {
      status: 'responded',
      read_by_customer: false,
      thread: [...existingThread, entry],
    },
    overrideAccess: true,
  });

  void notifyCustomerOfSupportReply(payload, updated as SupportThread, doc as SupportThread).catch(
    (error) => {
      payload.logger.error({ err: error, msg: 'No se pudo crear la notificación de soporte' });
    },
  );

  return payload.findByID({
    collection: 'support-messages',
    id: updated.id,
    depth: 2,
    overrideAccess: true,
  });
}

export async function staffDeleteChatMessages(
  payload: Payload,
  id: string | number,
  keys: string[],
  scope: DeleteScope,
) {
  const doc = await payload.findByID({
    collection: 'support-messages',
    id,
    overrideAccess: true,
  });

  const updateData = applyMessageDeletions(doc as SupportThread, keys, 'staff', scope);

  const updated = await payload.update({
    collection: 'support-messages',
    id,
    data: updateData,
    overrideAccess: true,
  });

  return payload.findByID({
    collection: 'support-messages',
    id: updated.id,
    depth: 2,
    overrideAccess: true,
  });
}

export async function staffDeleteAllChatMessages(
  payload: Payload,
  id: string | number,
  scope: DeleteScope,
) {
  const doc = await payload.findByID({
    collection: 'support-messages',
    id,
    overrideAccess: true,
  });

  const updateData = applyDeleteAll(doc as SupportThread, 'staff', scope);

  const updated = await payload.update({
    collection: 'support-messages',
    id,
    data: updateData,
    overrideAccess: true,
  });

  return payload.findByID({
    collection: 'support-messages',
    id: updated.id,
    depth: 2,
    overrideAccess: true,
  });
}

export async function staffCreateChatForClient(payload: Payload, email: string) {
  const users = await payload.find({
    collection: 'users',
    where: {
      and: [{ email: { equals: email.trim() } }, { role: { equals: 'cliente' } }],
    },
    limit: 1,
    overrideAccess: true,
  });

  const client = users.docs[0];
  if (!client) {
    throw new AppError('No se encontró un cliente con ese correo', 404, 'CLIENT_NOT_FOUND');
  }

  const userId = Number(client.id);
  const { chat, created } = await createClientChat(payload, {
    userId,
    source: 'staff_initiated',
  });

  const populated = await payload.findByID({
    collection: 'support-messages',
    id: chat.id,
    depth: 2,
    overrideAccess: true,
  });

  return { message: populated, created };
}
