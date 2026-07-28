'use client';

import { formatCurrency } from '@middlepoint/shared';
import { useFormFields } from '@payloadcms/ui';

type AddressJson = {
  street?: string;
  city?: string;
  province?: string;
  reference?: string;
};

type ContactJson = {
  name?: string;
  phone?: string;
  email?: string;
};

type PaymentAccountJson = {
  holderName?: string;
  bankName?: string;
  accountNumber?: string;
  accountTypeLabel?: string;
  currency?: string;
  currencyLabel?: string;
  rnc?: string;
  documentId?: string;
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
};

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div className="grid gap-1 border-b border-[var(--theme-elevation-100)] py-2 last:border-0 sm:grid-cols-[9rem_1fr]">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--theme-elevation-500)]">
        {label}
      </dt>
      <dd className="text-sm text-[var(--theme-text)]">{value}</dd>
    </div>
  );
}

export function OrderDetailsCardField() {
  const data = useFormFields(([fields]) => ({
    total: fields.total?.value as number | undefined,
    currency: (fields.currency?.value as 'DOP' | 'USD' | undefined) || 'DOP',
    paymentMethod: fields.payment_method?.value as string | undefined,
    address: fields.address?.value as AddressJson | undefined,
    contactPrimary: fields.contact_primary?.value as ContactJson | undefined,
    contactSecondary: fields.contact_secondary?.value as ContactJson | undefined,
    paymentAccount: fields.payment_account?.value as PaymentAccountJson | undefined,
  }));

  const totalFormatted =
    typeof data.total === 'number'
      ? formatCurrency(data.total, data.currency, 'es')
      : '—';

  const addressLines = [
    data.address?.street,
    [data.address?.city, data.address?.province].filter(Boolean).join(', '),
    data.address?.reference,
  ].filter(Boolean);

  const account = data.paymentAccount;
  const accountValue = account?.accountNumber?.trim()
    ? [
        account.bankName,
        account.currencyLabel || account.currency,
        account.accountTypeLabel,
        account.accountNumber,
        account.holderName,
      ]
        .filter(Boolean)
        .join(' · ')
    : undefined;

  return (
    <div className="mb-6 rounded-lg border border-[var(--theme-elevation-150)] bg-[var(--theme-elevation-50)] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--theme-text)]">
        Datos del cliente (solo lectura)
      </h3>
      <p className="mb-3 text-xs text-[var(--theme-elevation-500)]">
        Estos datos solo puede modificarlos el cliente desde su cuenta o en el checkout.
      </p>
      <dl>
        <Row label="Total" value={totalFormatted} />
        <Row
          label="Pago"
          value={data.paymentMethod ? PAYMENT_LABELS[data.paymentMethod] || data.paymentMethod : undefined}
        />
        <Row label="Cuenta de pago" value={accountValue} />
        <Row label="Dirección" value={addressLines.join(' · ') || undefined} />
        <Row label="Contacto" value={data.contactPrimary?.name} />
        <Row label="Teléfono" value={data.contactPrimary?.phone} />
        <Row label="Email" value={data.contactPrimary?.email} />
        {data.contactSecondary?.name && (
          <>
            <Row
              label="Contacto alt."
              value={`${data.contactSecondary.name}${data.contactSecondary.phone ? ` · ${data.contactSecondary.phone}` : ''}`}
            />
            <Row label="Email alt." value={data.contactSecondary.email} />
          </>
        )}
      </dl>
    </div>
  );
}
