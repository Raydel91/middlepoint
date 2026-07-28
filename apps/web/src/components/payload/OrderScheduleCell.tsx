'use client';

import { useEffect, useState } from 'react';
import type { DefaultCellComponentProps } from 'payload';
import type { UserRole } from '@middlepoint/shared';
import { isDeliveryRole, isOfficeStaffRole } from '@middlepoint/shared';
import { useAuth } from '@payloadcms/ui';
import { CalendarClock } from 'lucide-react';
import { formatOrderScheduleDisplay } from '@/lib/order-status-workflow';
import { RescheduleOrderModal } from './RescheduleOrderModal';
import { useForceListRefresh } from './useForceListRefresh';

type OrderRow = {
  id: string | number;
  status?: string;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
};

export function OrderScheduleCell({ rowData }: DefaultCellComponentProps) {
  const order = rowData as OrderRow;
  const { user } = useAuth();
  const refreshList = useForceListRefresh();
  const role = user?.role as UserRole | undefined;
  const canEdit = isOfficeStaffRole(role) && !isDeliveryRole(role);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [schedule, setSchedule] = useState({
    date: order.scheduled_date || '',
    time: order.scheduled_time || '',
  });

  useEffect(() => {
    setSchedule({
      date: order.scheduled_date || '',
      time: order.scheduled_time || '',
    });
  }, [order.id, order.scheduled_date, order.scheduled_time]);

  const label = formatOrderScheduleDisplay(schedule.date, schedule.time);
  const terminal =
    order.status === 'cancelled' || order.status === 'delivered' || order.status === 'returned';

  async function handleReschedule(scheduledDate: string, scheduledTime: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          scheduledDate,
          scheduledTime,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo reagendar');
      setSchedule({ date: scheduledDate, time: scheduledTime });
      setOpen(false);
      await refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reagendar');
    } finally {
      setLoading(false);
    }
  }

  if (!canEdit || terminal) {
    return <span>{label}</span>;
  }

  return (
    <div className="mp-list-cell-edit">
      <button
        type="button"
        className="mp-list-schedule-btn"
        onClick={() => setOpen(true)}
        title="Cambiar fecha de entrega"
        aria-label={`Cambiar fecha de entrega del pedido ${order.id}`}
      >
        <CalendarClock size={14} />
        <span>{label}</span>
      </button>
      {error && (
        <p className="mp-list-cell-error" role="alert">
          {error}
        </p>
      )}
      <RescheduleOrderModal
        open={open}
        orderId={order.id}
        initialDate={schedule.date}
        initialTime={schedule.time || '12:00'}
        loading={loading}
        onClose={() => setOpen(false)}
        onConfirm={handleReschedule}
      />
    </div>
  );
}
