import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth/config';
import { CartView } from '@/components/cart/CartView';

type Props = { params: Promise<{ locale: string }> };

export default async function CartPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/carrito`);
  }

  const t = await getTranslations('cart');

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 font-secondary text-3xl font-bold">{t('title')}</h1>
      <CartView />
    </div>
  );
}
