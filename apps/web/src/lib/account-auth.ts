import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { isStaffRole } from '@middlepoint/shared';

export async function requireCustomerAccount(locale: string) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/cuenta`);
  }

  if (isStaffRole(session.user.role)) {
    redirect(`/${locale}/dashboard`);
  }

  return session;
}
