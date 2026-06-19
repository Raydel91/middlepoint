import { setRequestLocale, getTranslations } from 'next-intl/server';
import { AccountNav } from '@/components/account/AccountNav';
import { requireCustomerAccount } from '@/lib/account-auth';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AccountLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCustomerAccount(locale);
  const t = await getTranslations('account');

  const navItems = [
    { href: '/cuenta', label: t('navProfile') },
    { href: '/cuenta/pedidos', label: t('navOrders') },
    { href: '/cuenta/notificaciones', label: t('navNotifications') },
    { href: '/cuenta/mensajes', label: t('navMessages') },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <AccountNav items={navItems} />
      {children}
    </div>
  );
}
