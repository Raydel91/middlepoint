import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { getStoreContent } from '@/lib/store-content';
import type { Locale } from '@middlepoint/shared';
import { CartProvider } from '@/components/cart/CartProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { BRAND } from '@/lib/brand';
import type { Metadata, Viewport } from 'next';
import '../globals.css';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'brand' });

  return {
    title: {
      default: `${t('name')} - ${t('slogan')}`,
      template: `%s | ${t('name')}`,
    },
    description: t('slogan'),
    alternates: {
      languages: {
        es: '/es',
        en: '/en',
      },
    },
    openGraph: {
      title: t('name'),
      description: t('slogan'),
      locale: locale === 'es' ? 'es_DO' : 'en_US',
      siteName: BRAND.brand.name,
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as 'es' | 'en')) notFound();

  setRequestLocale(locale);
  const [messages, storeContent] = await Promise.all([
    getMessages(),
    getStoreContent(locale as Locale),
  ]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
            <CartProvider>
              <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <WhatsAppButton
                whatsappHref={storeContent.contact.whatsappHref}
                label={locale === 'es' ? 'Contactar por WhatsApp' : 'Contact us on WhatsApp'}
              />
            </CartProvider>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
