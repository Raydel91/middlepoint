'use client';

import { useEffect, useState } from 'react';
import { Button } from '@payloadcms/ui';
import { X } from 'lucide-react';
import { AdminPortal, useModalOpenClass } from './AdminPortal';

type Props = {
  open: boolean;
  orderId: string | number;
  initialDate: string;
  initialTime: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: (date: string, time: string) => void;
};

export function RescheduleOrderModal({
  open,
  orderId,
  initialDate,
  initialTime,
  loading,
  onClose,
  onConfirm,
}: Props) {
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  useModalOpenClass(open);

  useEffect(() => {
    if (open) {
      setDate(initialDate);
      setTime(initialTime);
    }
  }, [open, initialDate, initialTime]);

  if (!open) return null;

  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(time);

  return (
    <AdminPortal>
      <div
        className="mp-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-order-title"
      >
        <div className="mp-modal-panel">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 id="reschedule-order-title" className="mp-modal-title">
                Reagendar pedido #{orderId}
              </h2>
              <p className="mp-modal-subtitle">
                El cliente recibirá una notificación con la nueva fecha y hora.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mp-icon-btn mp-icon-btn--ghost shrink-0"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mp-field-label" htmlFor="reschedule-date">
                Fecha
              </label>
              <input
                id="reschedule-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mp-field-input"
              />
            </div>
            <div>
              <label className="mp-field-label" htmlFor="reschedule-time">
                Hora
              </label>
              <input
                id="reschedule-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mp-field-input"
              />
            </div>
          </div>

          <div className="mp-modal-actions">
            <Button buttonStyle="secondary" onClick={onClose} disabled={loading}>
              Cerrar
            </Button>
            <Button onClick={() => onConfirm(date, time)} disabled={loading || !valid}>
              {loading ? 'Guardando...' : 'Confirmar reagendamiento'}
            </Button>
          </div>
        </div>
      </div>
    </AdminPortal>
  );
}
