import { NextResponse } from 'next/server';
import type { OrderStatus } from '@middlepoint/shared';
import { handleApiError, AppError } from '@/lib/logger';
import { getCustomerSession } from '@/lib/account-auth';
import { getPayloadClient } from '@/lib/payload';
import { accountOrderScheduleSchema } from '@/lib/validations';
import { canCustomerRescheduleOrder } from '@/lib/order-status-workflow';

type RouteContext = { params: Promise<{ id: string }> };

function resolveOrderUserId(order: { user?: unknown }) {
  if (!order.user) return null;
  if (typeof order.user === 'object' && order.user !== null && 'id' in order.user) {
    return Number((order.user as { id: number }).id);
  }
  return Number(order.user);
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getCustomerSession();
    if (!session?.user) {
      throw new AppError('No autorizado', 401, 'UNAUTHORIZED');
    }

    const { id } = await context.params;
    const orderId = Number(id);
    if (!Number.isFinite(orderId)) {
      throw new AppError('Pedido inválido', 400, 'VALIDATION_ERROR');
    }

    const body = await request.json();
    const parsed = accountOrderScheduleSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Fecha u hora inválida', 400, 'VALIDATION_ERROR');
    }

    const payload = await getPayloadClient();
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
      overrideAccess: true,
    });

    const ownerId = resolveOrderUserId(order);
    if (!ownerId || String(ownerId) !== String(session.user.id)) {
      throw new AppError('No autorizado', 403, 'FORBIDDEN');
    }

    const status = order.status as OrderStatus;
    if (!canCustomerRescheduleOrder(status)) {
      throw new AppError(
        'No se puede cambiar la fecha de un pedido en tránsito o finalizado',
        400,
        'INVALID_STATUS',
      );
    }

    const updated = await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        scheduled_date: parsed.data.scheduledDate,
        scheduled_time: parsed.data.scheduledTime,
      },
      overrideAccess: true,
    });

    return NextResponse.json({
      success: true,
      order: {
        id: updated.id,
        scheduled_date: updated.scheduled_date,
        scheduled_time: updated.scheduled_time,
      },
    });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
