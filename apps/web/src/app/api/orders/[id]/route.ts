import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import { auth } from '@/lib/auth/config';
import { handleApiError, AppError } from '@/lib/logger';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();
    const payload = await getPayloadClient();

    const order = await payload.findByID({
      collection: 'orders',
      id,
      depth: 2,
    });

    if (!session?.user) {
      throw new AppError('No autorizado', 401, 'UNAUTHORIZED');
    }

    const isOwner =
      typeof order.user === 'object'
        ? String(order.user?.id) === session.user.id
        : String(order.user) === session.user.id;

    const isStaff = ['super_admin', 'operador', 'delivery'].includes(session.user.role);

    if (!isOwner && !isStaff) {
      throw new AppError('No autorizado', 403, 'FORBIDDEN');
    }

    return NextResponse.json(order);
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
