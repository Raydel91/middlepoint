import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getPayloadClient } from '@/lib/payload';
import { type Locale } from '@middlepoint/shared';
import { CustomerOrders } from '@/components/account/CustomerAccountPanels';
import { fetchAccountOrders } from '@/lib/account-data';
import { requireCustomerAccount } from '@/lib/account-auth';

type Props = { params: Promise<{ locale: string }> };

export default async function AccountOrdersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireCustomerAccount(locale);
  const t = await getTranslations('account');
  const tc = await getTranslations('checkout');

  const userId = Number(session.user.id);
  let orders: Awaited<ReturnType<typeof fetchAccountOrders>> = [];

  if (Number.isFinite(userId)) {
    const payload = await getPayloadClient();
    orders = await fetchAccountOrders(payload, userId, session.user.email);
  }

  return (
    <CustomerOrders
      orders={orders}
      locale={locale as Locale}
      labels={{
        title: t('ordersTitle'),
        empty: t('ordersEmpty'),
        orderLabel: t('orderLabel'),
        payment: t('orderPayment'),
        cash: t('orderCash'),
        transfer: t('orderTransfer'),
        notificationsHint: t('ordersNotificationsHint'),
        selectAll: t('ordersSelectAll'),
        deselectAll: t('ordersDeselectAll'),
        deleteNotificationsSelected: t('ordersDeleteNotificationsSelected'),
        deleteNotificationsOld: t('ordersDeleteNotificationsOld'),
        deleteNotificationsCancelled: t('ordersDeleteNotificationsCancelled'),
        deleteNotificationsReturned: t('ordersDeleteNotificationsReturned'),
        deleteNotificationsAll: t('ordersDeleteNotificationsAll'),
        confirmDeleteNotifications: t('ordersConfirmDeleteNotifications'),
        downloadReceipt: t('orderDownloadReceipt'),
        downloadingReceipt: t('orderDownloadingReceipt'),
        receiptError: t('orderReceiptError'),
        deliveryDate: t('orderDeliveryDate'),
        reschedule: t('orderReschedule'),
        rescheduleTitle: t('orderRescheduleTitle'),
        rescheduleSubtitle: t('orderRescheduleSubtitle'),
        rescheduleDate: t('orderRescheduleDate'),
        rescheduleTime: t('orderRescheduleTime'),
        rescheduleCancel: t('orderRescheduleCancel'),
        rescheduleSave: t('orderRescheduleSave'),
        rescheduleSaving: t('orderRescheduleSaving'),
        rescheduleError: t('orderRescheduleError'),
        receipt: {
          summary: tc('receiptTitle'),
          slogan: tc('receiptSlogan'),
          product: tc('receiptProduct'),
          amount: tc('receiptAmount'),
          total: tc('total'),
          customer: tc('receiptCustomer'),
          phone: tc('phone'),
          payment: tc('payment'),
          cash: tc('cash'),
          transfer: tc('transfer'),
          account: tc('receiptAccount'),
          delivery: tc('receiptDelivery'),
          schedule: tc('receiptSchedule'),
          thanks: tc('receiptThanks'),
        },
      }}
    />
  );
}
