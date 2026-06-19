import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPayloadClient } from '@/lib/payload';
import { handleApiError, AppError } from '@/lib/logger';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'cliente') {
      throw new AppError('No autorizado', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    const { id } = await context.params;
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

    const updated = await payload.update({
      collection: 'customer-notifications',
      id,
      data: { read: true },
      overrideAccess: true,
    });

    return NextResponse.json({ notification: updated });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
