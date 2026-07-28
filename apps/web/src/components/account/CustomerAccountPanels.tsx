'use client';

import { useEffect, useState } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { notifyAccountCountsChanged } from '@/hooks/useAccountCounts';
import { ClientDateTime } from '@/components/ui/ClientDateTime';
import { getOrderStatusCopy } from '@/lib/order-notifications';
import type { OrderStatus } from '@middlepoint/shared';
import { formatCurrency } from '@middlepoint/shared';
import type { Locale } from '@middlepoint/shared';
import { generateReceiptPdf } from '@/lib/receipt-pdf';
import {
  canCustomerRescheduleOrder,
  formatOrderScheduleDisplay,
} from '@/lib/order-status-workflow';
import { CustomerRescheduleModal } from '@/components/account/CustomerRescheduleModal';

function resolveRelationId(value: unknown): string | number | null {
  if (value == null) return null;
  if (typeof value === 'object' && 'id' in value) {
    return (value as { id: string | number }).id;
  }
  return value as string | number;
}

type Notification = {
  id: string | number;
  title: string;
  body: string;
  read?: boolean | null;
  createdAt: string;
  support_message?: unknown;
};

type Labels = {
  title: string;
  empty: string;
  markRead: string;
  markUnread: string;
  delete: string;
  deleteAll: string;
  selectAll: string;
  deselectAll: string;
  markSelectedRead: string;
  markSelectedUnread: string;
  deleteSelected: string;
  markAllRead: string;
  markAllUnread: string;
  confirmDelete: string;
  confirmDeleteAll: string;
  viewMessage: string;
};

type Props = {
  notifications: Notification[];
  locale: Locale;
  labels: Labels;
};

async function bulkAction(body: Record<string, unknown>) {
  const res = await fetch('/api/account/notifications/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error');
  }
}

export function CustomerNotifications({ notifications, locale, labels }: Props) {
  const router = useRouter();
  const t = useTranslations('account');
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [loading, setLoading] = useState(false);

  const allSelected = notifications.length > 0 && selected.size === notifications.length;
  const dateLocale = locale === 'es' ? 'es-DO' : 'en-US';

  function toggleOne(id: string | number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(notifications.map((n) => n.id)));
    }
  }

  async function runAction(action: () => Promise<void>) {
    setLoading(true);
    try {
      await action();
      setSelected(new Set());
      notifyAccountCountsChanged();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function patchOne(id: string | number, read: boolean) {
    await fetch(`/api/account/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read }),
    });
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-secondary text-xl font-semibold text-secondary">{labels.title}</h2>
        {selected.size > 0 && (
          <span className="text-xs text-secondary/60">
            {t('notificationsSelected', { count: selected.size })}
          </span>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={toggleAll}
          disabled={loading}
          className="rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-medium text-secondary hover:bg-primary/5"
        >
          {allSelected ? labels.deselectAll : labels.selectAll}
        </button>
        {selected.size > 0 && (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                runAction(() => bulkAction({ action: 'markRead', ids: [...selected] }))
              }
              className="rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
            >
              {labels.markSelectedRead}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                runAction(() => bulkAction({ action: 'markUnread', ids: [...selected] }))
              }
              className="rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-medium text-secondary hover:bg-primary/5"
            >
              {labels.markSelectedUnread}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                if (!window.confirm(labels.confirmDelete)) return;
                runAction(() => bulkAction({ action: 'delete', ids: [...selected] }));
              }}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              {labels.deleteSelected}
            </button>
          </>
        )}
        <button
          type="button"
          disabled={loading}
          onClick={() => runAction(() => bulkAction({ action: 'markRead' }))}
          className="rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
        >
          {labels.markAllRead}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => runAction(() => bulkAction({ action: 'markUnread' }))}
          className="rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-medium text-secondary hover:bg-primary/5"
        >
          {labels.markAllUnread}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            if (!window.confirm(labels.confirmDeleteAll)) return;
            runAction(() => bulkAction({ action: 'deleteAll' }));
          }}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          {labels.deleteAll}
        </button>
      </div>

      <ul className="space-y-3">
        {notifications.map((notification) => {
          const isSelected = selected.has(notification.id);
          return (
            <li
              key={notification.id}
              className={`rounded-xl border p-4 ${
                notification.read ? 'border-primary/10 bg-white' : 'border-primary/30 bg-primary/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOne(notification.id)}
                  className="mt-1 h-4 w-4 rounded border-primary/30 text-primary"
                  aria-label={notification.title}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold text-secondary">{notification.title}</p>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {notification.read ? (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() =>
                            runAction(async () => {
                              await patchOne(notification.id, false);
                            })
                          }
                          className="text-xs font-semibold text-secondary/70 hover:underline"
                        >
                          {labels.markUnread}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() =>
                            runAction(async () => {
                              await patchOne(notification.id, true);
                            })
                          }
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          {labels.markRead}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => {
                          if (!window.confirm(labels.confirmDelete)) return;
                          runAction(async () => {
                            await fetch(`/api/account/notifications/${notification.id}`, {
                              method: 'DELETE',
                            });
                          });
                        }}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        {labels.delete}
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-secondary/80">{notification.body}</p>
                  {resolveRelationId(notification.support_message) && (
                    <Link
                      href={`/cuenta/mensajes?hilo=${resolveRelationId(notification.support_message)}`}
                      className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
                    >
                      {labels.viewMessage}
                    </Link>
                  )}
                  <p className="mt-2 text-xs text-secondary/50">
                    <ClientDateTime value={notification.createdAt} locale={dateLocale} />
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type ReceiptStaticLabels = {
  summary: string;
  slogan: string;
  product: string;
  amount: string;
  total: string;
  customer: string;
  phone: string;
  payment: string;
  cash: string;
  transfer: string;
  account: string;
  delivery: string;
  schedule: string;
  thanks: string;
};

type OrderLabels = {
  title: string;
  empty: string;
  orderLabel: string;
  payment: string;
  cash: string;
  transfer: string;
  notificationsHint: string;
  selectAll: string;
  deselectAll: string;
  deleteNotificationsSelected: string;
  deleteNotificationsOld: string;
  deleteNotificationsCancelled: string;
  deleteNotificationsReturned: string;
  deleteNotificationsAll: string;
  confirmDeleteNotifications: string;
  downloadReceipt: string;
  downloadingReceipt: string;
  receiptError: string;
  deliveryDate: string;
  reschedule: string;
  rescheduleTitle: string;
  rescheduleSubtitle: string;
  rescheduleDate: string;
  rescheduleTime: string;
  rescheduleCancel: string;
  rescheduleSave: string;
  rescheduleSaving: string;
  rescheduleError: string;
  receipt: ReceiptStaticLabels;
};

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
    scheduled_date?: string | null;
    scheduled_time?: string | null;
  }>;
  locale: Locale;
  labels: OrderLabels;
}) {
  const router = useRouter();
  const t = useTranslations('account');
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | number | null>(null);
  const [scheduleByOrder, setScheduleByOrder] = useState<
    Record<string, { date: string; time: string }>
  >(() => {
    const initial: Record<string, { date: string; time: string }> = {};
    for (const order of orders) {
      initial[String(order.id)] = {
        date: order.scheduled_date || '',
        time: order.scheduled_time || '',
      };
    }
    return initial;
  });
  const [rescheduleOrderId, setRescheduleOrderId] = useState<string | number | null>(null);

  useEffect(() => {
    setScheduleByOrder((prev) => {
      const next: Record<string, { date: string; time: string }> = { ...prev };
      for (const order of orders) {
        const key = String(order.id);
        if (!next[key]) {
          next[key] = {
            date: order.scheduled_date || '',
            time: order.scheduled_time || '',
          };
        }
      }
      return next;
    });
  }, [orders]);

  const allSelected = orders.length > 0 && selected.size === orders.length;
  const dateLocale = locale === 'es' ? 'es-DO' : 'en-US';
  const rescheduleTarget = orders.find((o) => o.id === rescheduleOrderId);
  const rescheduleSchedule = rescheduleOrderId
    ? scheduleByOrder[String(rescheduleOrderId)]
    : null;

  async function downloadReceipt(orderId: string | number) {
    if (downloadingId !== null) return;
    setDownloadingId(orderId);
    try {
      const res = await fetch(`/api/account/orders/${orderId}/receipt?locale=${locale}`);
      if (!res.ok) throw new Error('receipt_error');
      const data = await res.json();
      await generateReceiptPdf(
        data.receipt,
        { ...labels.receipt, orderNumber: `${labels.orderLabel} #${orderId}` },
        `comprobante-${orderId}.pdf`,
      );
    } catch {
      window.alert(labels.receiptError);
    } finally {
      setDownloadingId(null);
    }
  }

  function toggleOne(id: string | number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(orders.map((o) => o.id)));
  }

  async function runBulk(body: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch('/api/account/notifications/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Error');
      setSelected(new Set());
      notifyAccountCountsChanged();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

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
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-secondary text-xl font-semibold text-secondary">{labels.title}</h2>
        {selected.size > 0 && (
          <span className="text-xs text-secondary/60">
            {t('ordersSelected', { count: selected.size })}
          </span>
        )}
      </div>
      <p className="mb-4 text-xs text-secondary/60">{labels.notificationsHint}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={toggleAll}
          disabled={loading}
          className="rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-medium text-secondary hover:bg-primary/5"
        >
          {allSelected ? labels.deselectAll : labels.selectAll}
        </button>
        {selected.size > 0 && (
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              if (!window.confirm(labels.confirmDeleteNotifications)) return;
              runBulk({ action: 'deleteForOrders', orderIds: [...selected] });
            }}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            {labels.deleteNotificationsSelected}
          </button>
        )}
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            if (!window.confirm(labels.confirmDeleteNotifications)) return;
            runBulk({ action: 'deleteForOrderFilter', filter: 'old' });
          }}
          className="rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-medium text-secondary hover:bg-primary/5"
        >
          {labels.deleteNotificationsOld}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            if (!window.confirm(labels.confirmDeleteNotifications)) return;
            runBulk({ action: 'deleteForOrderFilter', filter: 'cancelled' });
          }}
          className="rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-medium text-secondary hover:bg-primary/5"
        >
          {labels.deleteNotificationsCancelled}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            if (!window.confirm(labels.confirmDeleteNotifications)) return;
            runBulk({ action: 'deleteForOrderFilter', filter: 'returned' });
          }}
          className="rounded-lg border border-primary/20 px-3 py-1.5 text-xs font-medium text-secondary hover:bg-primary/5"
        >
          {labels.deleteNotificationsReturned}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            if (!window.confirm(labels.confirmDeleteNotifications)) return;
            runBulk({ action: 'deleteAllOrderNotifications' });
          }}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          {labels.deleteNotificationsAll}
        </button>
      </div>

      <ul className="space-y-3">
        {orders.map((order) => {
          const statusCopy = getOrderStatusCopy(order.status, locale);
          const paymentLabel = order.payment_method === 'transfer' ? labels.transfer : labels.cash;
          const isSelected = selected.has(order.id);
          const schedule = scheduleByOrder[String(order.id)] || {
            date: order.scheduled_date || '',
            time: order.scheduled_time || '',
          };
          const canReschedule = canCustomerRescheduleOrder(order.status);

          return (
            <li key={order.id} className="rounded-xl border border-primary/10 p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOne(order.id)}
                  className="mt-1 h-4 w-4 rounded border-primary/30 text-primary"
                  aria-label={`${labels.orderLabel} #${order.id}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-secondary">
                        {labels.orderLabel} #{order.id}
                      </p>
                      <p className="mt-1 text-sm text-primary">{statusCopy.title}</p>
                      <p className="text-xs text-secondary/60">{statusCopy.body}</p>
                    </div>
                    <p className="font-bold text-secondary">
                      {formatCurrency(
                        order.total,
                        (order.currency as 'DOP' | 'USD') || 'DOP',
                        locale,
                      )}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-secondary/50">
                    {labels.payment}: {paymentLabel} ·{' '}
                    <ClientDateTime
                      value={order.createdAt}
                      locale={dateLocale}
                      dateStyle="short"
                    />
                  </p>
                  <p className="mt-1 text-xs text-secondary/70">
                    {labels.deliveryDate}:{' '}
                    {formatOrderScheduleDisplay(schedule.date, schedule.time, dateLocale)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {canReschedule && (
                      <button
                        type="button"
                        onClick={() => setRescheduleOrderId(order.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5"
                      >
                        {labels.reschedule}
                      </button>
                    )}
                    {order.status !== 'cancelled' && (
                      <button
                        type="button"
                        disabled={downloadingId === order.id}
                        onClick={() => downloadReceipt(order.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/5 disabled:opacity-60"
                      >
                        {downloadingId === order.id
                          ? labels.downloadingReceipt
                          : labels.downloadReceipt}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {rescheduleTarget && rescheduleSchedule && (
        <CustomerRescheduleModal
          open={rescheduleOrderId != null}
          orderId={rescheduleTarget.id}
          initialDate={rescheduleSchedule.date}
          initialTime={rescheduleSchedule.time || '12:00'}
          labels={{
            title: labels.rescheduleTitle,
            subtitle: labels.rescheduleSubtitle,
            date: labels.rescheduleDate,
            time: labels.rescheduleTime,
            cancel: labels.rescheduleCancel,
            save: labels.rescheduleSave,
            saving: labels.rescheduleSaving,
            error: labels.rescheduleError,
          }}
          onClose={() => setRescheduleOrderId(null)}
          onSaved={(date, time) => {
            setScheduleByOrder((prev) => ({
              ...prev,
              [String(rescheduleTarget.id)]: { date, time },
            }));
            router.refresh();
          }}
        />
      )}
    </section>
  );
}
