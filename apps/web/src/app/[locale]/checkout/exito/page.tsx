import { setRequestLocale, getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { getPayloadClient } from '@/lib/payload';
import { getStoreContent } from '@/lib/store-content';
import { logger } from '@/lib/logger';
import { TransferBankDetails } from '@/components/checkout/TransferBankDetails';
import { ReceiptActions } from '@/components/checkout/ReceiptActions';
import { formatCurrency, type Currency, type Locale } from '@middlepoint/shared';
import type { BankAccount } from '@/lib/store-content';
import { buildOrderReceiptMessage, type OrderReceiptData } from '@/lib/order-receipt';
import { buildOrderReceiptDataFromOrder } from '@/lib/order-receipt-data';
import { buildWhatsAppChatUrl } from '@/lib/whatsapp';

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
  let chosenAccount: BankAccount | null = null;
  let receiptMessage = '';
  let orderCurrency: Currency = 'DOP';
  let receiptData: OrderReceiptData | null = null;

  if (orderId) {
    try {
      const payload = await getPayloadClient();
      const order = await payload.findByID({
        collection: 'orders',
        id: orderId,
        overrideAccess: true,
      });

      receiptData = await buildOrderReceiptDataFromOrder(payload, order, locale as Locale);
      paymentMethod = receiptData.paymentMethod as 'cash' | 'transfer';
      chosenAccount = receiptData.paymentAccount ?? null;
      orderCurrency = receiptData.currency;

      receiptMessage = buildOrderReceiptMessage(receiptData);
    } catch (err) {
      logger.error('No se pudo construir el comprobante en la página de éxito', {
        orderId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const receiptItems = receiptData?.items ?? [];
  const orderTotal = receiptData ? receiptData.total : null;

  const successAccounts =
    chosenAccount && chosenAccount.accountNumber?.trim()
      ? [chosenAccount]
      : content.payment.accounts;

  const confirmationWhatsappUrl =
    receiptMessage && content.contact.orderConfirmationWhatsapp
      ? buildWhatsAppChatUrl(content.contact.orderConfirmationWhatsapp, receiptMessage)
      : '';

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="card space-y-4 p-8 text-left">
        <div className="text-center">
          <Image
            src="/icono.svg"
            alt="MiddlePoint"
            width={64}
            height={64}
            className="mx-auto"
            priority
          />
          <h1 className="mt-4 font-secondary text-2xl font-bold text-primary">{t('success')}</h1>
          {orderId && <p className="mt-2 text-secondary/60">{t('orderNumber', { orderId })}</p>}
          <p className="mt-4 text-secondary/80">{t('successMessage')}</p>
        </div>

        {receiptItems.length > 0 && (
          <div className="rounded-lg border border-primary/20 bg-white p-4 text-sm">
            <p className="mb-3 font-semibold text-secondary">{t('receiptTitle')}</p>
            <ul className="space-y-2">
              {receiptItems.map((item, index) => (
                <li key={index} className="flex flex-wrap justify-between gap-2">
                  <span className="text-secondary/70">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium text-secondary">
                    {formatCurrency(item.price * item.quantity, orderCurrency, locale as Locale)}
                  </span>
                </li>
              ))}
            </ul>
            {orderTotal !== null && (
              <div className="mt-3 flex justify-between border-t border-primary/10 pt-3 font-bold text-secondary">
                <span>{t('total')}</span>
                <span className="text-primary">
                  {formatCurrency(orderTotal, orderCurrency, locale as Locale)}
                </span>
              </div>
            )}
          </div>
        )}

        {paymentMethod === 'transfer' && (
          <TransferBankDetails
            accounts={successAccounts}
            instructions={content.payment.instructions}
            labels={{
              title: t('transferDetailsTitle'),
              holder: t('transferHolder'),
              bank: t('transferBank'),
              accountNumber: t('transferAccountNumber'),
              accountType: t('transferAccountType'),
              currency: t('transferCurrency'),
              rnc: t('transferRnc'),
              documentId: t('transferDocument'),
              instructions: t('transferInstructionsFallback'),
              orderReference: orderId
                ? t('transferOrderReference', { order: t('orderNumber', { orderId }) })
                : undefined,
            }}
          />
        )}

        {receiptData && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
            <p className="mb-3 text-secondary/80">{t('receiptHint')}</p>
            <ReceiptActions
              whatsappUrl={confirmationWhatsappUrl || undefined}
              whatsappLabel={t('receiptSend')}
              pdfLabel={t('receiptDownloadPdf')}
              pdfFileName={`comprobante-${orderId ?? 'pedido'}.pdf`}
              receipt={receiptData}
              labels={{
                summary: t('receiptTitle'),
                orderNumber: t('orderNumber', { orderId: orderId ?? '' }),
                slogan: t('receiptSlogan'),
                product: t('receiptProduct'),
                amount: t('receiptAmount'),
                total: t('total'),
                customer: t('receiptCustomer'),
                phone: t('phone'),
                payment: t('payment'),
                cash: t('cash'),
                transfer: t('transfer'),
                account: t('receiptAccount'),
                delivery: t('receiptDelivery'),
                schedule: t('receiptSchedule'),
                thanks: t('receiptThanks'),
              }}
            />
          </div>
        )}

        <div className="text-center">
          <Link href="/" className="btn-primary mt-2 inline-block">
            {t('backHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
