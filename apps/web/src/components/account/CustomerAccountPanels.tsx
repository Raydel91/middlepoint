'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { getOrderStatusCopy } from '@/lib/order-notifications';
import type { OrderStatus } from '@middlepoint/shared';
import type { Locale } from '@middlepoint/shared';
import { formatCurrency } from '@middlepoint/shared';

type Notification = {
  id: string | number;
  title: string;
  body: string;
  read?: boolean | null;
  createdAt: string;
};

type Props = {
  notifications: Notification[];
  locale: Locale;
  labels: {
    title: string;
    empty: string;
    markRead: string;
  };
};

export function CustomerNotifications({ notifications, locale, labels }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | number | null>(null);

  async function markRead(id: string | number) {
    setLoadingId(id);
    try {
      await fetch(`/api/account/notifications/${id}`, { method: 'PATCH' });
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  if (notifications.length === 0) {
    return (
      <section className="card p-6">
        <h2 className="font-secondary text-xl font-semibold text-secondary">{labels.title}</h2>
        <p className="mt-3 text-sm text-secondary/60">{labels.empty}</p>
      </section>
    );
  }

  return (
    <section className="card p-6">
      <h2 className="mb-4 font-secondary text-xl font-semibold text-secondary">{labels.title}</h2>
      <ul className="space-y-3">
        {notifications.map((notification) => (
          <li
            key={notification.id}
            className={`rounded-xl border p-4 ${
              notification.read ? 'border-primary/10 bg-white' : 'border-primary/30 bg-primary/5'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-secondary">{notification.title}</p>
                <p className="mt-1 text-sm text-secondary/80">{notification.body}</p>
                <p className="mt-2 text-xs text-secondary/50">
                  {new Date(notification.createdAt).toLocaleString(locale === 'es' ? 'es-DO' : 'en-US')}
                </p>
              </div>
              {!notification.read && (
                <button
                  type="button"
                  onClick={() => markRead(notification.id)}
                  disabled={loadingId === notification.id}
                  className="shrink-0 text-xs font-semibold text-primary hover:underline"
                >
                  {labels.markRead}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CustomerOrders({
  orders,
  locale,
  labels,
}: {
  orders: Array<{
    id: string | number;
    total: number;
    status: OrderStatus;
    payment_method: string;
    currency?: string | null;
    createdAt: string;
  }>;
  locale: Locale;
  labels: { title: string; empty: string; orderLabel: string; payment: string; cash: string; transfer: string };
}) {
  if (orders.length === 0) {
    return (
      <section className="card p-6">
        <h2 className="font-secondary text-xl font-semibold text-secondary">{labels.title}</h2>
        <p className="mt-3 text-sm text-secondary/60">{labels.empty}</p>
      </section>
    );
  }

  return (
    <section className="card p-6">
      <h2 className="mb-4 font-secondary text-xl font-semibold text-secondary">{labels.title}</h2>
      <ul className="space-y-3">
        {orders.map((order) => {
          const statusCopy = getOrderStatusCopy(order.status, locale);
          const paymentLabel = order.payment_method === 'transfer' ? labels.transfer : labels.cash;
          return (
            <li key={order.id} className="rounded-xl border border-primary/10 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-secondary">
                    {labels.orderLabel} #{order.id}
                  </p>
                  <p className="mt-1 text-sm text-primary">{statusCopy.title}</p>
                  <p className="text-xs text-secondary/60">{statusCopy.body}</p>
                </div>
                <p className="font-bold text-secondary">
                  {formatCurrency(order.total, (order.currency as 'DOP' | 'USD') || 'DOP', locale)}
                </p>
              </div>
              <p className="mt-2 text-xs text-secondary/50">
                {labels.payment}: {paymentLabel} ·{' '}
                {new Date(order.createdAt).toLocaleDateString(locale === 'es' ? 'es-DO' : 'en-US')}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
