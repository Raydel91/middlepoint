import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCustomerSession } from '@/lib/account-auth';
import { getPayloadClient } from '@/lib/payload';
import { handleApiError, AppError } from '@/lib/logger';

type RouteContext = { params: Promise<{ id: string }> };

const replySchema = z.object({
  message: z.string().min(2).max(2000),
});

async function getOwnedThread(userId: number, id: string) {
  const payload = await getPayloadClient();
  const doc = await payload.findByID({
    collection: 'support-messages',
    id,
    overrideAccess: true,
  });

  const ownerId =
    typeof doc.user === 'object' && doc.user !== null
      ? Number(doc.user.id)
      : Number(doc.user);

  if (ownerId !== userId) {
    throw new AppError('No autorizado', 403, 'FORBIDDEN');
  }

  return doc;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      throw new AppError('No autorizado', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    const { id } = await context.params;
    const body = await request.json();
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    const doc = await getOwnedThread(userId, id);

    const payload = await getPayloadClient();
    const existingThread = Array.isArray(doc.thread) ? doc.thread : [];
    const now = new Date().toISOString();
    const trimmed = parsed.data.message.trim();
    const hasInitialMessage = Boolean(doc.message?.trim());

    const updateData: Record<string, unknown> = {
      status: 'received',
      read_by_customer: true,
    };

    if (!hasInitialMessage) {
      updateData.message = trimmed;
    } else {
      updateData.thread = [
        ...existingThread,
        {
          role: 'customer',
          body: trimmed,
          sent_at: now,
        },
      ];
    }

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
