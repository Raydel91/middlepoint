import type { OrderStatus } from '@middlepoint/shared';
import {
  CheckCircle2,
  CircleCheck,
  Clock,
  Package,
  RotateCcw,
  Truck,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

/** Estados de pedido visibles y accionables por el rol delivery. */
export const DELIVERY_ORDER_STATUSES: OrderStatus[] = [
  'in_transit',
  'delivered',
  'returned',
];

/** Acciones de pedido que un delivery puede ejecutar según el estado actual. */
export function getDeliveryAllowedActions(
  status: OrderStatus,
): Array<'advance' | 'return'> {
  if (status === 'in_transit') return ['advance', 'return'];
  if (status === 'delivered') return ['return'];
  return [];
}

export function isDeliveryVisibleOrderStatus(status: string | null | undefined): boolean {
  return !!status && (DELIVERY_ORDER_STATUSES as string[]).includes(status);
}

/** Flujo lineal de preparación y entrega (excluye cancelado/devuelto). */
export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'in_transit',
  'delivered',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  in_transit: 'En tránsito',
  delivered: 'Entregado',
  returned: 'Devuelto',
  cancelled: 'Cancelado',
};

export const ORDER_STATUS_ICONS: Record<OrderStatus, LucideIcon> = {
  pending: Clock,
  confirmed: CheckCircle2,
  preparing: UtensilsCrossed,
  ready: Package,
  in_transit: Truck,
  delivered: CircleCheck,
  returned: RotateCcw,
  cancelled: CircleCheck,
};

/** Pestañas del listado admin (orden del flujo operativo). */
export const ORDER_LIST_TABS: Array<{ id: OrderStatus | 'all'; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'pending', label: ORDER_STATUS_LABELS.pending },
  { id: 'confirmed', label: ORDER_STATUS_LABELS.confirmed },
  { id: 'preparing', label: ORDER_STATUS_LABELS.preparing },
  { id: 'ready', label: ORDER_STATUS_LABELS.ready },
  { id: 'in_transit', label: ORDER_STATUS_LABELS.in_transit },
  { id: 'delivered', label: ORDER_STATUS_LABELS.delivered },
  { id: 'returned', label: ORDER_STATUS_LABELS.returned },
  { id: 'cancelled', label: ORDER_STATUS_LABELS.cancelled },
];

/** Pestañas visibles para el rol delivery. */
export const DELIVERY_ORDER_LIST_TABS: Array<{ id: OrderStatus | 'all'; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'in_transit', label: ORDER_STATUS_LABELS.in_transit },
  { id: 'delivered', label: ORDER_STATUS_LABELS.delivered },
  { id: 'returned', label: ORDER_STATUS_LABELS.returned },
];

const TERMINAL_STATUSES: OrderStatus[] = ['cancelled', 'delivered', 'returned'];

export function getNextStatus(current: OrderStatus): OrderStatus | null {
  if (TERMINAL_STATUSES.includes(current)) return null;
  const idx = ORDER_STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[idx + 1]!;
}

export function canAdvanceStatus(current: OrderStatus): boolean {
  return getNextStatus(current) !== null;
}

export const DELIVERY_REQUIRED_FOR_TRANSIT_MESSAGE =
  'Asigna un delivery antes de pasar el pedido a en tránsito';

/** Resuelve el id de una relación Payload (número u objeto con id). */
export function resolveRelationId(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = Number((value as { id: unknown }).id);
    return Number.isFinite(id) ? id : null;
  }
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}

export function hasDeliveryAssigned(delivery: unknown): boolean {
  return resolveRelationId(delivery) !== null;
}

/** True cuando el estado destino exige delivery asignado. */
export function statusRequiresDelivery(status: OrderStatus | null | undefined): boolean {
  return status === 'in_transit';
}

export function canCancelOrder(current: OrderStatus): boolean {
  return !TERMINAL_STATUSES.includes(current);
}

export function canRevertOrder(current: OrderStatus): boolean {
  return current === 'cancelled';
}

/** El cliente puede cambiar fecha/hora solo antes de que el pedido salga en tránsito. */
export function canCustomerRescheduleOrder(status: OrderStatus): boolean {
  return status === 'pending' || status === 'confirmed' || status === 'preparing' || status === 'ready';
}

export function formatOrderScheduleDisplay(
  date?: string | null,
  time?: string | null,
  locale = 'es-DO',
): string {
  if (!date?.trim() && !time?.trim()) return '—';
  const parts: string[] = [];
  if (date?.trim()) {
    try {
      parts.push(
        new Date(`${date.trim()}T12:00:00`).toLocaleDateString(locale, {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
      );
    } catch {
      parts.push(date.trim());
    }
  }
  if (time?.trim()) parts.push(time.trim());
  return parts.join(' · ');
}

export const REVERT_ORDER_STATUS: OrderStatus = 'confirmed';

export function getAdvanceLabel(current: OrderStatus): string {
  const next = getNextStatus(current);
  if (!next) return ORDER_STATUS_LABELS[current];
  return `Avanzar a ${ORDER_STATUS_LABELS[next]}`;
}

export function parseStatusTabFromWhere(where: unknown): OrderStatus | 'all' {
  if (!where || typeof where !== 'object') return 'all';
  const w = where as { status?: { equals?: string } };
  const value = w.status?.equals;
  if (value && value in ORDER_STATUS_LABELS) return value as OrderStatus;
  return 'all';
}

export function buildWhereForStatusTab(tab: OrderStatus | 'all') {
  if (tab === 'all') return {};
  return { status: { equals: tab } };
}
