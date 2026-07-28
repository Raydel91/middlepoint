import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCustomerSession } from '@/lib/account-auth';
import { getPayloadClient } from '@/lib/payload';
import { handleApiError, AppError } from '@/lib/logger';

type RouteContext = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  read: z.boolean().optional(),
});

async function getOwnedNotification(userId: number, id: string) {
  const payload = await getPayloadClient();
  const notification = await payload.findByID({
    collection: 'customer-notifications',
    id,
    overrideAccess: true,
  });

  const ownerId =
    typeof notification.user === 'object' && notification.user !== null
      ? Number(notification.user.id)
      : Number(notification.user);

  if (ownerId !== userId) {
    throw new AppError('No autorizado', 403, 'FORBIDDEN');
  }

  return notification;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      throw new AppError('No autorizado', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    await getOwnedNotification(userId, id);
    const payload = await getPayloadClient();

    const updated = await payload.update({
      collection: 'customer-notifications',
      id,
      data: { read: parsed.data.read ?? true },
      overrideAccess: true,
    });

    return NextResponse.json({ notification: updated });
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
    await getOwnedNotification(userId, id);

    const payload = await getPayloadClient();
    await payload.delete({
      collection: 'customer-notifications',
      id,
      overrideAccess: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
