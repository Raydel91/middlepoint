'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useCart } from '@/components/cart/CartProvider';
import { formatCurrency, type Locale } from '@middlepoint/shared';
import { TransferBankDetails } from './TransferBankDetails';
import type { ResolvedStoreContent } from '@/lib/store-content';
import { checkoutSchema } from '@/lib/validations';

type CheckoutDefaults = {
  address: {
    street: string;
    city: string;
    province: string;
    reference?: string;
  };
  contactPrimary: {
    name: string;
    phone: string;
    email?: string;
  };
  contactSecondary?: {
    name: string;
    phone: string;
    email?: string;
  };
};

type Props = {
  bankTransfer: ResolvedStoreContent['payment'];
  defaults?: CheckoutDefaults;
};

export function CheckoutForm({ bankTransfer, defaults }: Props) {
  const t = useTranslations('checkout');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [paymentAccountIndex, setPaymentAccountIndex] = useState(0);
  const [dateBounds, setDateBounds] = useState<{ min: string; max: string }>({ min: '', max: '' });

  const transferAccounts = bankTransfer.accounts.filter((a) => a.accountNumber?.trim());

  const [street, setStreet] = useState(defaults?.address.street || '');
  const [city, setCity] = useState(defaults?.address.city || '');
  const [province, setProvince] = useState(defaults?.address.province || '');
  const [reference, setReference] = useState(defaults?.address.reference || '');
  const [name, setName] = useState(defaults?.contactPrimary.name || '');
  const [phone, setPhone] = useState(defaults?.contactPrimary.phone || '');
  const [email, setEmail] = useState(defaults?.contactPrimary.email || '');
  const [secondaryName, setSecondaryName] = useState(defaults?.contactSecondary?.name || '');
  const [secondaryPhone, setSecondaryPhone] = useState(defaults?.contactSecondary?.phone || '');
  const [secondaryEmail, setSecondaryEmail] = useState(defaults?.contactSecondary?.email || '');

  useEffect(() => {
    fetch('/api/csrf')
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken))
      .catch(() => {});
  }, []);

  // Se calcula tras el montaje para evitar desajustes de hidratación (SSR/cliente).
  useEffect(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const toStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const today = new Date();
    const max = new Date(today);
    max.setMonth(max.getMonth() + 6);
    setDateBounds({ min: toStr(today), max: toStr(max) });
  }, []);

  function isValidSchedule(date?: string, time?: string): boolean {
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
      if (dateBounds.min && date < dateBounds.min) return false;
      if (dateBounds.max && date > dateBounds.max) return false;
    }
    if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return false;
    return true;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const scheduledDate =
      (form.elements.namedItem('date') as HTMLInputElement | null)?.value || undefined;
    const scheduledTime =
      (form.elements.namedItem('time') as HTMLInputElement | null)?.value || undefined;

    if (!scheduledDate || !scheduledTime) {
      setError(t('scheduleRequired'));
      return;
    }
    if (!isValidSchedule(scheduledDate, scheduledTime)) {
      setError(t('invalidSchedule'));
      return;
    }

    setLoading(true);
    setError('');

    let token = csrfToken;
    if (!token) {
      const csrfRes = await fetch('/api/csrf');
      const csrfData = await csrfRes.json();
      token = csrfData.csrfToken;
    }

    const address = {
      street: street.trim(),
      city: city.trim(),
      province: province.trim(),
      reference: reference.trim() || undefined,
    };
    const contactPrimary = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
    };
    const hasSecondary = secondaryName.trim() && secondaryPhone.trim();
    const contactSecondary = hasSecondary
      ? {
          name: secondaryName.trim(),
          phone: secondaryPhone.trim(),
          email: secondaryEmail.trim() || undefined,
        }
      : undefined;

    const payload = {
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
      })),
      paymentMethod,
      paymentAccountIndex: paymentMethod === 'transfer' ? paymentAccountIndex : undefined,
      address,
      contactPrimary,
      contactSecondary,
      scheduledDate,
      scheduledTime,
      currency: 'DOP' as const,
      locale,
      csrfToken: token,
    };

    const validation = checkoutSchema.safeParse(payload);
    if (!validation.success) {
      const field = validation.error.issues[0]?.path.join('.') ?? '';
      if (field.includes('phone')) {
        setError(t('invalidPhone'));
      } else {
        setError(t('invalidData'));
      }
      setLoading(false);
      return;
    }

    try {
      fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'checkout_start' }),
      }).catch(() => {});

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('error'));

      clearCart();
      router.push(`/checkout/exito?orderId=${data.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}

      <section className="card p-6">
        <h2 className="mb-4 font-secondary text-lg font-semibold">{t('address')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            name="street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder={t('street')}
            required
            className="input-field md:col-span-2"
          />
          <input
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t('city')}
            required
            className="input-field"
          />
          <input
            name="province"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            placeholder={t('province')}
            required
            className="input-field"
          />
          <input
            name="reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={t('reference')}
            className="input-field md:col-span-2"
          />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-4 font-secondary text-lg font-semibold">{t('contact')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('name')}
            required
            className="input-field"
          />
          <input
            name="phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('phone')}
            required
            className="input-field"
          />
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('email')}
            className="input-field md:col-span-2"
          />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-4 font-secondary text-lg font-semibold">{t('contactSecondary')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            name="secondaryName"
            value={secondaryName}
            onChange={(e) => setSecondaryName(e.target.value)}
            placeholder={t('name')}
            className="input-field"
          />
          <input
            name="secondaryPhone"
            type="tel"
            inputMode="tel"
            value={secondaryPhone}
            onChange={(e) => setSecondaryPhone(e.target.value)}
            placeholder={t('phone')}
            className="input-field"
          />
          <input
            name="secondaryEmail"
            type="email"
            value={secondaryEmail}
            onChange={(e) => setSecondaryEmail(e.target.value)}
            placeholder={t('email')}
            className="input-field md:col-span-2"
          />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-4 font-secondary text-lg font-semibold">{t('payment')}</h2>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              checked={paymentMethod === 'cash'}
              onChange={() => setPaymentMethod('cash')}
            />
            {t('cash')}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="paymentMethod"
              value="transfer"
              checked={paymentMethod === 'transfer'}
              onChange={() => setPaymentMethod('transfer')}
            />
            {t('transfer')}
          </label>
        </div>
        {paymentMethod === 'transfer' && (
          <div className="mt-4">
            <TransferBankDetails
              accounts={transferAccounts}
              instructions={bankTransfer.instructions}
              selectedIndex={paymentAccountIndex}
              onSelect={setPaymentAccountIndex}
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
                chooseAccount: t('transferChooseAccount'),
              }}
            />
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="mb-4 font-secondary text-lg font-semibold">
          {t('schedule')} <span className="text-red-500">*</span>
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            name="date"
            type="date"
            required
            className="input-field"
            min={dateBounds.min || undefined}
            max={dateBounds.max || undefined}
          />
          <input name="time" type="time" required className="input-field" />
        </div>
        <p className="mt-2 text-xs text-secondary/60">{t('scheduleHint')}</p>
      </section>

      <div className="card p-6">
        <div className="flex justify-between text-xl font-bold">
          <span>{t('total')}</span>
          <span className="text-primary">{formatCurrency(total, 'DOP', locale)}</span>
        </div>
        <button type="submit" disabled={loading || items.length === 0} className="btn-primary mt-4 w-full">
          {loading ? '...' : t('placeOrder')}
        </button>
      </div>
    </form>
  );
}
