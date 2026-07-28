import type { Where } from 'payload';
import {
  DELIVERY_ORDER_STATUSES,
  isDeliveryVisibleOrderStatus,
  resolveRelationId,
} from '@/lib/order-status-workflow';

export { DELIVERY_ORDER_STATUSES, isDeliveryVisibleOrderStatus };
export { getDeliveryAllowedActions } from '@/lib/order-status-workflow';

/** Constraint de lectura/escritura de pedidos para un repartidor (asignado por user id). */
export function buildDeliveryOrdersWhere(userId: string | number): Where {
  return {
    and: [
      { delivery: { equals: userId } },
      { status: { in: DELIVERY_ORDER_STATUSES } },
    ],
  };
}

export function assertOrderAssignedToDelivery(
  order: { delivery?: unknown },
  userId: string | number,
): boolean {
  const assignedId = resolveRelationId(order.delivery);
  if (assignedId == null) return false;
  return String(assignedId) === String(userId);
}
