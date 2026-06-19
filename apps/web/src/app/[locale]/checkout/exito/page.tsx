import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getPayloadClient } from '@/lib/payload';
import { getStoreContent } from '@/lib/store-content';
import { TransferBankDetails } from '@/components/checkout/TransferBankDetails';
import type { Locale } from '@middlepoint/shared';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ orderId?: string }>;
};

export default async function CheckoutSuccessPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { orderId } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('checkout');
  const content = await getStoreContent(locale as Locale);

  let paymentMethod: 'cash' | 'transfer' | null = null;

  if (orderId) {
    try {
      const payload = await getPayloadClient();
      const order = await payload.findByID({
        collection: 'orders',
        id: orderId,
        overrideAccess: true,
      });
      paymentMethod = order.payment_method as 'cash' | 'transfer';
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="card space-y-4 p-8 text-left">
        <div className="text-center">
          <span className="text-5xl">✅</span>
          <h1 className="mt-4 font-secondary text-2xl font-bold text-primary">{t('success')}</h1>
          {orderId && <p className="mt-2 text-secondary/60">Pedido #{orderId}</p>}
          <p className="mt-4 text-secondary/80">{t('successMessage')}</p>
        </div>

        {paymentMethod === 'transfer' && (
          <TransferBankDetails
            details={content.payment}
            orderReference={orderId}
            labels={{
              title: t('transferDetailsTitle'),
              holder: t('transferHolder'),
              bank: t('transferBank'),
              accountNumber: t('transferAccountNumber'),
              accountType: t('transferAccountType'),
              rnc: t('transferRnc'),
              documentId: t('transferDocument'),
              instructions: t('transferInstructionsFallback'),
            }}
          />
        )}

        <div className="text-center">
          <Link href="/" className="btn-primary mt-2 inline-block">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
