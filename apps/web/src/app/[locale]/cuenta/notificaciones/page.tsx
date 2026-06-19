import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getPayloadClient } from '@/lib/payload';
import { type Locale } from '@middlepoint/shared';
import { CustomerNotifications } from '@/components/account/CustomerAccountPanels';
import { fetchAccountNotifications } from '@/lib/account-data';
import { requireCustomerAccount } from '@/lib/account-auth';

type Props = { params: Promise<{ locale: string }> };

export default async function AccountNotificationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireCustomerAccount(locale);
  const t = await getTranslations('account');

  const userId = Number(session.user.id);
  let notifications: Awaited<ReturnType<typeof fetchAccountNotifications>> = [];

  if (Number.isFinite(userId)) {
    const payload = await getPayloadClient();
    notifications = await fetchAccountNotifications(payload, userId);
  }

  return (
    <CustomerNotifications
      notifications={notifications as Parameters<typeof CustomerNotifications>[0]['notifications']}
      locale={locale as Locale}
      labels={{
        title: t('notificationsTitle'),
        empty: t('notificationsEmpty'),
        markRead: t('notificationsMarkRead'),
      }}
    />
  );
}
