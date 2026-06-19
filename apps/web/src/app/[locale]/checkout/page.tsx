import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { getStoreContent } from '@/lib/store-content';
import { getPayloadClient } from '@/lib/payload';
import { getCheckoutDefaultsFromUser } from '@/lib/user-delivery-profile';
import type { Locale } from '@middlepoint/shared';

type Props = { params: Promise<{ locale: string }> };

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/checkout`);
  }

  const t = await getTranslations('checkout');
  const content = await getStoreContent(locale as Locale);

  let checkoutDefaults;
  if (session.user.id) {
    const payload = await getPayloadClient();
    const user = await payload.findByID({
      collection: 'users',
      id: Number(session.user.id),
      overrideAccess: true,
    });
    checkoutDefaults = getCheckoutDefaultsFromUser(user);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 font-secondary text-3xl font-bold">{t('title')}</h1>
      <CheckoutForm bankTransfer={content.payment} defaults={checkoutDefaults} />
    </div>
  );
}