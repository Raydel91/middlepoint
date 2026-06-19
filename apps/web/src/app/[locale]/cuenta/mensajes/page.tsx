import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getPayloadClient } from '@/lib/payload';
import { SupportSection } from '@/components/account/SupportSection';
import { fetchAccountSupportMessages } from '@/lib/account-data';
import { requireCustomerAccount } from '@/lib/account-auth';

type Props = { params: Promise<{ locale: string }> };

export default async function AccountMessagesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireCustomerAccount(locale);
  const t = await getTranslations('account');

  const userId = Number(session.user.id);
  let supportMessages: Awaited<ReturnType<typeof fetchAccountSupportMessages>> = [];

  if (Number.isFinite(userId)) {
    const payload = await getPayloadClient();
    supportMessages = await fetchAccountSupportMessages(payload, userId);
  }

  return (
    <SupportSection
      messages={supportMessages as Parameters<typeof SupportSection>[0]['messages']}
      labels={{
        title: t('supportTitle'),
        subject: t('supportSubject'),
        message: t('supportMessage'),
        submit: t('supportSubmit'),
        success: t('supportSuccess'),
        error: t('supportError'),
        empty: t('supportEmpty'),
        yourMessage: t('supportYourMessage'),
        teamReply: t('supportTeamReply'),
        statusOpen: t('supportStatusOpen'),
        statusAnswered: t('supportStatusAnswered'),
        statusClosed: t('supportStatusClosed'),
      }}
    />
  );
}
