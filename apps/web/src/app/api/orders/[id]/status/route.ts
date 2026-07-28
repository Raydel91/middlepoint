import { NextRequest, NextResponse } from 'next/server';
import { getServices } from '@/lib/payload';
import { auth } from '@/lib/auth/config';
import { handleApiError, AppError } from '@/lib/logger';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'in_transit',
    'delivered',
    'returned',
    'cancelled',
  ]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user || !['super_admin', 'operador', 'delivery'].includes(session.user.role)) {
      throw new AppError('No autorizado', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    const services = await getServices();
    const order = await services.order.updateStatus(id, parsed.data.status);

    return NextResponse.json(order);
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
