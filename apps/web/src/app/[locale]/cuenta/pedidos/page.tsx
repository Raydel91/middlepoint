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
      }}
    />
  );
}
