'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@middlepoint/shared';

type Props = {
  open: boolean;
  orderId: string | number;
  initialDate: string;
  initialTime: string;
  labels: {
    title: string;
    subtitle: string;
    date: string;
    time: string;
    cancel: string;
    save: string;
    saving: string;
    error: string;
  };
  onClose: () => void;
  onSaved: (date: string, time: string) => void;
};

export function CustomerRescheduleModal({
  open,
  orderId,
  initialDate,
  initialTime,
  labels,
  onClose,
  onSaved,
}: Props) {
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bounds, setBounds] = useState<{ min: string; max: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(initialDate);
    setTime(initialTime || '12:00');
    setError('');
    const pad = (n: number) => String(n).padStart(2, '0');
    const toStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const today = new Date();
    const max = new Date(today);
    max.setMonth(max.getMonth() + 6);
    setBounds({ min: toStr(today), max: toStr(max) });
  }, [open, initialDate, initialTime]);

  if (!open) return null;

  const valid =
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    /^\d{2}:\d{2}$/.test(time) &&
    (!bounds || (date >= bounds.min && date <= bounds.max));

  async function handleSave() {
    if (!valid || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/account/orders/${orderId}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledDate: date, scheduledTime: time }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || labels.error);
      onSaved(date, time);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-reschedule-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-background p-5 shadow-xl">
        <h2 id="customer-reschedule-title" className="font-secondary text-lg font-semibold text-secondary">
          {labels.title} #{orderId}
        </h2>
        <p className="mt-1 text-sm text-secondary/60">{labels.subtitle}</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary" htmlFor="customer-reschedule-date">
              {labels.date}
            </label>
            <input
              id="customer-reschedule-date"
              type="date"
              value={date}
              min={bounds?.min}
              max={bounds?.max}
              onChange={(e) => setDate(e.target.value)}
              className="input-field w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-secondary" htmlFor="customer-reschedule-time">
              {labels.time}
            </label>
            <input
              id="customer-reschedule-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="input-field w-full"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-primary/20 px-4 py-2 text-sm font-medium text-secondary hover:bg-primary/5"
          >
            {labels.cancel}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || !valid}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
          >
            {loading ? labels.saving : labels.save}
          </button>
        </div>
      </div>
    </div>
  );
}
