import { NextResponse } from 'next/server';
import type { OrderStatus } from '@middlepoint/shared';
import { isDeliveryRole, canAccessAdminNav, isDeliveryAssignableRole } from '@middlepoint/shared';
import { handleApiError, AppError } from '@/lib/logger';
import { adminOrderActionSchema } from '@/lib/validations';
import { requireStaffAdmin } from '@/lib/admin-auth';
import {
  canAdvanceStatus,
  canCancelOrder,
  canRevertOrder,
  DELIVERY_REQUIRED_FOR_TRANSIT_MESSAGE,
  getNextStatus,
  hasDeliveryAssigned,
  REVERT_ORDER_STATUS,
  statusRequiresDelivery,
} from '@/lib/order-status-workflow';
import { createCancellationSupportMessage } from '@/lib/order-cancel-message';
import {
  assertOrderAssignedToDelivery,
  getDeliveryAllowedActions,
  isDeliveryVisibleOrderStatus,
} from '@/lib/delivery-access';

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
    const { payload, user } = await requireStaffAdmin();
    const { id } = await context.params;
    const orderId = Number(id);
    if (!Number.isFinite(orderId)) {
      throw new AppError('Pedido inválido', 400, 'VALIDATION_ERROR');
    }

    const body = await request.json();
    const parsed = adminOrderActionSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      overrideAccess: true,
    });

    const currentStatus = order.status as OrderStatus;
    const isDelivery = isDeliveryRole(user.role);

    if (isDelivery) {
      const assigned = assertOrderAssignedToDelivery(order, user.id);
      if (!assigned || !isDeliveryVisibleOrderStatus(currentStatus)) {
        throw new AppError('No autorizado para este pedido', 403, 'FORBIDDEN');
      }

      const allowed = getDeliveryAllowedActions(currentStatus);

      if (parsed.data.action === 'advance') {
        if (!allowed.includes('advance') || !canAdvanceStatus(currentStatus)) {
          throw new AppError('No se puede avanzar este pedido', 400, 'INVALID_STATUS');
        }
        const nextStatus = getNextStatus(currentStatus)!;
        if (nextStatus !== 'delivered') {
          throw new AppError('Acción no permitida para delivery', 403, 'FORBIDDEN');
        }
        const updated = await payload.update({
          collection: 'orders',
          id: orderId,
          data: { status: nextStatus },
          overrideAccess: true,
        });
        return NextResponse.json({ success: true, order: updated });
      }

      if (parsed.data.action === 'return') {
        if (!allowed.includes('return')) {
          throw new AppError('No se puede marcar como devuelto', 400, 'INVALID_STATUS');
        }
        const updated = await payload.update({
          collection: 'orders',
          id: orderId,
          data: { status: 'returned' },
          overrideAccess: true,
        });
        return NextResponse.json({ success: true, order: updated });
      }

      throw new AppError('Acción no permitida para delivery', 403, 'FORBIDDEN');
    }

    if (!canAccessAdminNav(user.role, 'orders')) {
      throw new AppError('No autorizado', 403, 'FORBIDDEN');
    }

    if (parsed.data.action === 'return') {
      if (currentStatus !== 'in_transit' && currentStatus !== 'delivered') {
        throw new AppError('No se puede marcar como devuelto', 400, 'INVALID_STATUS');
      }
      const updated = await payload.update({
        collection: 'orders',
        id: orderId,
        data: { status: 'returned' },
        overrideAccess: true,
      });
      return NextResponse.json({ success: true, order: updated });
    }

    if (parsed.data.action === 'advance') {
      if (!canAdvanceStatus(currentStatus)) {
        throw new AppError('No se puede avanzar este pedido', 400, 'INVALID_STATUS');
      }

      const nextStatus = getNextStatus(currentStatus)!;
      if (statusRequiresDelivery(nextStatus) && !hasDeliveryAssigned(order.delivery)) {
        throw new AppError(
          DELIVERY_REQUIRED_FOR_TRANSIT_MESSAGE,
          400,
          'DELIVERY_REQUIRED',
        );
      }

      const updated = await payload.update({
        collection: 'orders',
        id: orderId,
        data: { status: nextStatus },
        overrideAccess: true,
      });

      return NextResponse.json({ success: true, order: updated });
    }

    if (parsed.data.action === 'reschedule') {
      if (currentStatus === 'cancelled' || currentStatus === 'delivered' || currentStatus === 'returned') {
        throw new AppError('No se puede reagendar este pedido', 400, 'INVALID_STATUS');
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

      return NextResponse.json({ success: true, order: updated });
    }

    if (parsed.data.action === 'assignDelivery') {
      if (parsed.data.deliveryUserId == null) {
        if (currentStatus === 'in_transit') {
          throw new AppError(
            'No se puede quitar el delivery de un pedido en tránsito',
            400,
            'DELIVERY_REQUIRED',
          );
        }
        const updated = await payload.update({
          collection: 'orders',
          id: orderId,
          data: { delivery: null },
          overrideAccess: true,
        });
        return NextResponse.json({ success: true, order: updated });
      }

      const deliveryUser = await payload.findByID({
        collection: 'users',
        id: parsed.data.deliveryUserId,
        depth: 0,
        overrideAccess: true,
      });

      const role = deliveryUser.role as string | undefined;
      if (!isDeliveryAssignableRole(role as never)) {
        throw new AppError('El usuario no puede asignarse como delivery', 400, 'VALIDATION_ERROR');
      }

      const updated = await payload.update({
        collection: 'orders',
        id: orderId,
        data: { delivery: parsed.data.deliveryUserId },
        overrideAccess: true,
      });

      return NextResponse.json({ success: true, order: updated });
    }

    if (parsed.data.action === 'revert') {
      if (!canRevertOrder(currentStatus)) {
        throw new AppError('No se puede revertir este pedido', 400, 'INVALID_STATUS');
      }

      const updated = await payload.update({
        collection: 'orders',
        id: orderId,
        data: {
          status: REVERT_ORDER_STATUS,
          cancellation_reason: null,
        },
        overrideAccess: true,
      });

      return NextResponse.json({ success: true, order: updated });
    }

    if (!canCancelOrder(currentStatus)) {
      throw new AppError('No se puede cancelar este pedido', 400, 'INVALID_STATUS');
    }

    const locale = order.customer_locale === 'en' ? 'en' : 'es';
    const userId = resolveOrderUserId(order);
    let supportMessageId: number | undefined;

    if (parsed.data.sendMessage) {
      if (!userId || !Number.isFinite(userId)) {
        throw new AppError(
          'El pedido no tiene una cuenta de cliente para enviar el mensaje',
          400,
          'NO_CUSTOMER',
        );
      }

      const supportMessage = await createCancellationSupportMessage(payload, {
        userId,
        orderId,
        reason: parsed.data.reason,
        locale,
      });
      supportMessageId = Number(supportMessage.id);
    }

    const updated = await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        status: 'cancelled',
        cancellation_reason: parsed.data.reason.trim(),
      },
      overrideAccess: true,
      context: {
        orderNotification: { supportMessageId },
      },
    });

    return NextResponse.json({ success: true, order: updated, supportMessageId });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
