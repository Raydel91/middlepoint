import type { ResolvedStoreContent } from '@/lib/store-content';

type BankDetails = ResolvedStoreContent['payment'];

type Labels = {
  title: string;
  holder: string;
  bank: string;
  accountNumber: string;
  accountType: string;
  rnc: string;
  documentId: string;
  instructions: string;
};

type Props = {
  details: BankDetails;
  labels: Labels;
  orderReference?: string;
};

export function TransferBankDetails({ details, labels, orderReference }: Props) {
  if (!details.accountNumber?.trim()) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
        {labels.instructions}
      </p>
    );
  }

  const rows = [
    { label: labels.holder, value: details.holderName },
    { label: labels.bank, value: details.bankName },
    { label: labels.accountType, value: details.accountTypeLabel },
    { label: labels.accountNumber, value: details.accountNumber },
    details.rnc ? { label: labels.rnc, value: details.rnc } : null,
    details.documentId ? { label: labels.documentId, value: details.documentId } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
      <p className="mb-3 font-semibold text-secondary">{labels.title}</p>
      <dl className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-wrap justify-between gap-2">
            <dt className="text-secondary/60">{row.label}</dt>
            <dd className="font-medium text-secondary">{row.value}</dd>
          </div>
        ))}
      </dl>
      {orderReference && (
        <p className="mt-3 text-secondary/70">
          Referencia: <span className="font-semibold">Pedido #{orderReference}</span>
        </p>
      )}
      {details.instructions && (
        <p className="mt-3 border-t border-primary/10 pt-3 text-secondary/80">{details.instructions}</p>
      )}
    </div>
  );
}
