import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { canUseStoreAccount } from '@middlepoint/shared';

export async function requireCustomerAccount(locale: string) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/cuenta`);
  }

  if (!canUseStoreAccount(session.user.role)) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/cuenta`);
  }

  return session;
}

export async function getCustomerSession() {
  const session = await auth();
  if (!session?.user || !canUseStoreAccount(session.user.role)) {
    return null;
  }
  return session;
}
