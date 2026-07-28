import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCustomerSession } from '@/lib/account-auth';
import { getPayloadClient } from '@/lib/payload';
import { handleApiError, AppError } from '@/lib/logger';
import { applyMessageDeletions, applyDeleteAll } from '@/lib/support-message-delete';
import type { SupportThread } from '@/lib/support-chat';

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('read'), read: z.boolean() }),
  z.object({
    action: z.literal('deleteMessage'),
    keys: z.array(z.string().min(1)).min(1),
    scope: z.enum(['me', 'everyone']).default('me'),
  }),
  z.object({
    action: z.literal('deleteAll'),
    scope: z.enum(['me', 'everyone']).default('me'),
  }),
]);

async function getOwnedMessage(userId: number, id: string) {
  const payload = await getPayloadClient();
  const message = await payload.findByID({
    collection: 'support-messages',
    id,
    overrideAccess: true,
  });

  const ownerId =
    typeof message.user === 'object' && message.user !== null
      ? Number(message.user.id)
      : Number(message.user);

  if (ownerId !== userId) {
    throw new AppError('No autorizado', 403, 'FORBIDDEN');
  }

  return message;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      throw new AppError('No autorizado', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    const doc = await getOwnedMessage(userId, id);
    const payload = await getPayloadClient();

    if (parsed.data.action === 'read') {
      const updated = await payload.update({
        collection: 'support-messages',
        id,
        data: { read_by_customer: parsed.data.read },
        overrideAccess: true,
      });
      return NextResponse.json({ message: updated });
    }

    const updateData =
      parsed.data.action === 'deleteAll'
        ? applyDeleteAll(doc as SupportThread, 'customer', parsed.data.scope)
        : applyMessageDeletions(
            doc as SupportThread,
            parsed.data.keys,
            'customer',
            parsed.data.scope,
          );

    const updated = await payload.update({
      collection: 'support-messages',
      id,
      data: updateData,
      overrideAccess: true,
    });

    return NextResponse.json({ message: updated });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      throw new AppError('No autorizado', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    const { id } = await context.params;
    await getOwnedMessage(userId, id);

    const payload = await getPayloadClient();
    await payload.delete({
      collection: 'support-messages',
      id,
      overrideAccess: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
