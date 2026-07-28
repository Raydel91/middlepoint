'use client';

import { useState } from 'react';
import { Button, useDocumentInfo, useForm, useFormFields } from '@payloadcms/ui';
import { CalendarClock } from 'lucide-react';
import { formatOrderScheduleDisplay } from '@/lib/order-status-workflow';
import { RescheduleOrderModal } from './RescheduleOrderModal';

export function OrderScheduleField() {
  const { id, setData, data } = useDocumentInfo();
  const { dispatchFields } = useForm();
  const schedule = useFormFields(([fields]) => ({
    date: (fields.scheduled_date?.value as string | undefined) || '',
    time: (fields.scheduled_time?.value as string | undefined) || '',
  }));

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!id) return null;

  async function handleReschedule(scheduledDate: string, scheduledTime: string) {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reschedule',
          scheduledDate,
          scheduledTime,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'No se pudo reagendar');

      dispatchFields({ type: 'UPDATE', path: 'scheduled_date', value: scheduledDate });
      dispatchFields({ type: 'UPDATE', path: 'scheduled_time', value: scheduledTime });

      if (data) {
        setData({
          ...data,
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
        });
      }

      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reagendar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4 rounded-lg border border-[var(--theme-elevation-150)] bg-[var(--theme-elevation-0)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--theme-text)]">Entrega programada</h3>
          <p className="mt-1 text-sm text-[var(--theme-elevation-600)]">
            {formatOrderScheduleDisplay(schedule.date, schedule.time) === '—'
              ? 'Sin programar'
              : formatOrderScheduleDisplay(schedule.date, schedule.time)}
          </p>
        </div>
        <Button
          buttonStyle="secondary"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2"
        >
          <CalendarClock size={16} />
          Reagendar
        </Button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <RescheduleOrderModal
        open={open}
        orderId={id}
        initialDate={schedule.date}
        initialTime={schedule.time || '12:00'}
        loading={loading}
        onClose={() => setOpen(false)}
        onConfirm={handleReschedule}
      />
    </div>
  );
}
