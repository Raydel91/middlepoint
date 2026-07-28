import type { BankAccount } from '@/lib/store-content';

type Labels = {
  title: string;
  holder: string;
  bank: string;
  accountNumber: string;
  accountType: string;
  currency: string;
  rnc: string;
  documentId: string;
  instructions: string;
  chooseAccount?: string;
  orderReference?: string;
};

type Props = {
  accounts: BankAccount[];
  instructions?: string;
  /** Índice de la cuenta a mostrar/seleccionada. */
  selectedIndex?: number;
  /** Si se provee, se muestra el selector para elegir cuenta. */
  onSelect?: (index: number) => void;
  labels: Labels;
};

function AccountRows({ account, labels }: { account: BankAccount; labels: Labels }) {
  const rows = [
    { label: labels.holder, value: account.holderName },
    { label: labels.bank, value: account.bankName },
    { label: labels.accountType, value: account.accountTypeLabel },
    { label: labels.currency, value: account.currencyLabel },
    { label: labels.accountNumber, value: account.accountNumber },
    account.rnc ? { label: labels.rnc, value: account.rnc } : null,
    account.documentId ? { label: labels.documentId, value: account.documentId } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <dl className="space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="flex flex-wrap justify-between gap-2">
          <dt className="text-secondary/60">{row.label}</dt>
          <dd className="font-medium text-secondary">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TransferBankDetails({
  accounts,
  instructions,
  selectedIndex = 0,
  onSelect,
  labels,
}: Props) {
  const usable = accounts.filter((a) => a.accountNumber?.trim());

  if (usable.length === 0) {
    return (
      <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">{labels.instructions}</p>
    );
  }

  const safeIndex = Math.min(Math.max(selectedIndex, 0), usable.length - 1);
  const selected = usable[safeIndex];
  const showChooser = Boolean(onSelect) && usable.length > 1;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
      <p className="mb-3 font-semibold text-secondary">{labels.title}</p>

      {showChooser && (
        <fieldset className="mb-4 space-y-2">
          {labels.chooseAccount && (
            <legend className="mb-2 text-secondary/70">{labels.chooseAccount}</legend>
          )}
          {usable.map((account, index) => (
            <label
              key={`${account.bankName}-${account.accountNumber}-${index}`}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                index === safeIndex
                  ? 'border-primary bg-white shadow-sm'
                  : 'border-primary/15 bg-white/50 hover:border-primary/40'
              }`}
            >
              <input
                type="radio"
                name="transfer-account"
                className="mt-1"
                checked={index === safeIndex}
                onChange={() => onSelect?.(index)}
              />
              <span className="flex flex-col">
                <span className="font-medium text-secondary">
                  {account.bankName} · {account.currency}
                </span>
                <span className="text-secondary/60">
                  {account.accountTypeLabel} · {account.accountNumber}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <AccountRows account={selected} labels={labels} />

      {labels.orderReference && <p className="mt-3 text-secondary/70">{labels.orderReference}</p>}

      {instructions && (
        <p className="mt-3 border-t border-primary/10 pt-3 text-secondary/80">{instructions}</p>
      )}
    </div>
  );
}
