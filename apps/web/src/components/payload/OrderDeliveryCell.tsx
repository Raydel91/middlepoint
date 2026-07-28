'use client';

import { useEffect, useState } from 'react';
import type { DefaultCellComponentProps } from 'payload';
import type { UserRole } from '@middlepoint/shared';
import { isDeliveryRole, isOfficeStaffRole } from '@middlepoint/shared';
import { useAuth } from '@payloadcms/ui';
import { resolveRelationId } from '@/lib/order-status-workflow';
import { useForceListRefresh } from './useForceListRefresh';

type DeliveryOption = {
  id: number | string;
  nombreCompleto: string;
};

type OrderRow = {
  id: string | number;
  delivery?: number | string | { id: number | string; nombre?: string; apellido?: string } | null;
};

function labelFromRow(delivery: OrderRow['delivery']): string {
  if (delivery && typeof delivery === 'object') {
    const name = [delivery.nombre, delivery.apellido].filter(Boolean).join(' ').trim();
    if (name) return name;
  }
  return '—';
}

let cachedOptions: DeliveryOption[] | null = null;
let optionsPromise: Promise<DeliveryOption[]> | null = null;

async function loadDeliveryOptions(): Promise<DeliveryOption[]> {
  if (cachedOptions) return cachedOptions;
  if (!optionsPromise) {
    optionsPromise = fetch('/api/admin/delivery-users')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los deliveries');
        cachedOptions = (data.users as DeliveryOption[]) || [];
        return cachedOptions;
      })
      .catch((err) => {
        optionsPromise = null;
        throw err;
      });
  }
  return optionsPromise;
}

export function OrderDeliveryCell({ rowData }: DefaultCellComponentProps) {
  const order = rowData as OrderRow;
  const { user } = useAuth();
  const refreshList = useForceListRefresh();
  const role = user?.role as UserRole | undefined;
  const canEdit = isOfficeStaffRole(role);
  const readOnly = isDeliveryRole(role) || !canEdit;

  const [options, setOptions] = useState<DeliveryOption[]>(cachedOptions || []);
  const [value, setValue] = useState(() => {
    const id = resolveRelationId(order.delivery);
    return id != null ? String(id) : '';
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = resolveRelationId(order.delivery);
    setValue(id != null ? String(id) : '');
  }, [order.delivery]);

  useEffect(() => {
    if (readOnly) return;
    let cancelled = false;
    loadDeliveryOptions()
      .then((users) => {
        if (!cancelled) setOptions(users);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudieron cargar opciones');
      });
    return () => {
      cancelled = true;
    };
  }, [readOnly]);

  if (readOnly) {
    return <span>{labelFromRow(order.delivery)}</span>;
  }

  async function handleChange(next: string) {
    if (saving) return;
    const previous = value;
    setValue(next);
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assignDelivery',
          deliveryUserId: next ? Number(next) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo asignar');
      await refreshList();
    } catch (err) {
      setValue(previous);
      setError(err instanceof Error ? err.message : 'Error al asignar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mp-list-cell-edit">
      <select
        className="mp-list-select"
        value={value}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Asignar delivery"
      >
        <option value="">Sin asignar</option>
        {options.map((opt) => (
          <option key={opt.id} value={String(opt.id)}>
            {opt.nombreCompleto}
          </option>
        ))}
      </select>
      {error && (
        <p className="mp-list-cell-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
