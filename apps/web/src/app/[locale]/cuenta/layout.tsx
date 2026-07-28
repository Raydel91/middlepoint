import { setRequestLocale } from 'next-intl/server';
import { requireCustomerAccount } from '@/lib/account-auth';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AccountLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireCustomerAccount(locale);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="space-y-6">{children}</div>
    </div>
  );
}
