'use client';

import { useEffect, useState } from 'react';
import type { DefaultCellComponentProps } from 'payload';
import type { OrderStatus, UserRole } from '@middlepoint/shared';
import { isDeliveryRole } from '@middlepoint/shared';
import { useAuth } from '@payloadcms/ui';
import { Ban, RotateCcw, Undo2 } from 'lucide-react';
import {
  canAdvanceStatus,
  canCancelOrder,
  canRevertOrder,
  DELIVERY_REQUIRED_FOR_TRANSIT_MESSAGE,
  getAdvanceLabel,
  getDeliveryAllowedActions,
  getNextStatus,
  hasDeliveryAssigned,
  ORDER_STATUS_ICONS,
  ORDER_STATUS_LABELS,
  REVERT_ORDER_STATUS,
  statusRequiresDelivery,
} from '@/lib/order-status-workflow';
import { CancelOrderModal } from './CancelOrderModal';
import { useForceListRefresh } from './useForceListRefresh';

type OrderRow = {
  id: string | number;
  status: OrderStatus;
  delivery?: number | string | { id: number | string } | null;
  contact_primary?: { name?: string; phone?: string; email?: string } | null;
};

export function OrderActionsCell({ rowData }: DefaultCellComponentProps) {
  const order = rowData as OrderRow;
  const { user } = useAuth();
  const refreshList = useForceListRefresh();
  const [loading, setLoading] = useState<'advance' | 'cancel' | 'revert' | 'return' | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<OrderStatus>(order.status);

  useEffect(() => {
    setStatus(order.status);
  }, [order.status, order.id]);

  const isDelivery = isDeliveryRole(user?.role as UserRole | undefined);
  const deliveryActions = isDelivery ? getDeliveryAllowedActions(status) : [];
  const nextStatus = getNextStatus(status);
  const needsDeliveryForAdvance =
    !isDelivery && statusRequiresDelivery(nextStatus) && !hasDeliveryAssigned(order.delivery);

  const StatusIcon = ORDER_STATUS_ICONS[status] ?? ORDER_STATUS_ICONS.pending;
  const canAdvance = isDelivery
    ? deliveryActions.includes('advance')
    : canAdvanceStatus(status) && !needsDeliveryForAdvance;
  const canReturn = isDelivery
    ? deliveryActions.includes('return')
    : status === 'in_transit' || status === 'delivered';
  const canCancel = !isDelivery && canCancelOrder(status);
  const canRevert = !isDelivery && canRevertOrder(status);

  async function handleAdvance() {
    if (!canAdvance || loading) return;
    const upcoming = getNextStatus(status);
    if (!upcoming) return;

    setLoading('advance');
    setError('');

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar el pedido');
      setStatus(upcoming);
      await refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setLoading(null);
    }
  }

  async function handleReturn() {
    if (!canReturn || loading) return;
    if (!window.confirm('¿Marcar este pedido como devuelto?')) return;

    setLoading('return');
    setError('');

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'return' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo marcar como devuelto');
      setStatus('returned');
      await refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al devolver');
    } finally {
      setLoading(null);
    }
  }

  async function handleCancel(reason: string, options: { sendMessage: boolean }) {
    setLoading('cancel');
    setError('');

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          reason,
          sendMessage: options.sendMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo cancelar el pedido');
      setCancelOpen(false);
      setStatus('cancelled');
      await refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar');
    } finally {
      setLoading(null);
    }
  }

  async function handleRevert() {
    if (!canRevert || loading) return;
    if (!window.confirm('¿Revertir la cancelación? El pedido volverá a estado Confirmado.')) return;

    setLoading('revert');
    setError('');

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revert' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo revertir el pedido');
      setStatus(REVERT_ORDER_STATUS);
      await refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al revertir');
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleAdvance}
          disabled={!canAdvance || loading !== null}
          title={
            needsDeliveryForAdvance
              ? DELIVERY_REQUIRED_FOR_TRANSIT_MESSAGE
              : canAdvance
                ? getAdvanceLabel(status)
                : ORDER_STATUS_LABELS[status]
          }
          aria-label={
            needsDeliveryForAdvance
              ? DELIVERY_REQUIRED_FOR_TRANSIT_MESSAGE
              : canAdvance
                ? getAdvanceLabel(status)
                : ORDER_STATUS_LABELS[status]
          }
          className="mp-icon-btn"
        >
          <StatusIcon size={18} />
        </button>

        {canReturn && (
          <button
            type="button"
            onClick={handleReturn}
            disabled={loading !== null}
            title="Marcar como devuelto"
            aria-label="Marcar como devuelto"
            className="mp-icon-btn"
          >
            <RotateCcw size={18} />
          </button>
        )}

        {canCancel && (
          <button
            type="button"
            onClick={() => setCancelOpen(true)}
            disabled={loading !== null}
            title="Cancelar pedido"
            aria-label="Cancelar pedido"
            className="mp-icon-btn mp-icon-btn--danger"
          >
            <Ban size={18} />
          </button>
        )}

        {canRevert && (
          <button
            type="button"
            onClick={handleRevert}
            disabled={loading !== null}
            title="Revertir cancelación"
            aria-label="Revertir cancelación"
            className="mp-icon-btn"
          >
            <Undo2 size={18} />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 max-w-[12rem] text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {!isDelivery && (
        <CancelOrderModal
          open={cancelOpen}
          order={order}
          loading={loading === 'cancel'}
          onClose={() => setCancelOpen(false)}
          onConfirm={handleCancel}
        />
      )}
    </>
  );
}
