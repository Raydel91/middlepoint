import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
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
    <Suspense fallback={<p className="text-center text-sm text-secondary/60">...</p>}>
      <SupportSection
        messages={supportMessages as Parameters<typeof SupportSection>[0]['messages']}
        labels={{
        title: t('supportTitle'),
        teamName: t('supportTeamName'),
        yourMessage: t('supportYourMessage'),
        teamReply: t('supportTeamReply'),
        statusPending: t('supportStatusPending'),
        statusResponded: t('supportStatusResponded'),
        noReplyYet: t('supportNoReplyYet'),
        sendInChat: t('supportSendInChat'),
        chatPlaceholder: t('supportChatPlaceholder'),
        chatClosed: t('supportChatClosed'),
        replyError: t('supportReplyError'),
        deleteMessage: t('supportDeleteMessage'),
        deleteChat: t('supportDeleteChat'),
        confirmDeleteMessage: t('supportConfirmDeleteMessage'),
        confirmDeleteChat: t('supportConfirmDeleteChat'),
        select: t('supportSelect'),
        cancel: t('supportCancel'),
        selectAll: t('supportSelectAll'),
        deleteForMe: t('supportDeleteForMe'),
        deleteForEveryone: t('supportDeleteForEveryone'),
      }}
      />
    </Suspense>
  );
}
