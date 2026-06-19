import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth/config';
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';
import { isStaffRole } from '@middlepoint/shared';

type Props = { params: Promise<{ locale: string }> };

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  const t = await getTranslations('dashboard');

  if (!session?.user || !isStaffRole(session.user.role)) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 font-secondary text-3xl font-bold">{t('title')}</h1>
      <h2 className="mb-4 text-xl font-semibold">{t('analytics')}</h2>
      <AnalyticsDashboard />
    </div>
  );
}
