'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useCart } from '@/components/cart/CartProvider';
import { formatCurrency, type Locale } from '@middlepoint/shared';
import { TransferBankDetails } from './TransferBankDetails';
import type { ResolvedStoreContent } from '@/lib/store-content';

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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

    try {
      await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'checkout_start' }),
      });

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
          })),
          paymentMethod,
          address,
          contactPrimary,
          contactSecondary,
          scheduledDate: (e.currentTarget.elements.namedItem('date') as HTMLInputElement)?.value || undefined,
          scheduledTime: (e.currentTarget.elements.namedItem('time') as HTMLInputElement)?.value || undefined,
          currency: 'DOP',
          csrfToken: token,
        }),
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
              details={bankTransfer}
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
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="mb-4 font-secondary text-lg font-semibold">{t('schedule')}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <input name="date" type="date" className="input-field" />
          <input name="time" type="time" className="input-field" />
        </div>
      </section>

      <div className="card p-6">
        <div className="flex justify-between text-xl font-bold">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(total, 'DOP', locale)}</span>
        </div>
        <button type="submit" disabled={loading || items.length === 0} className="btn-primary mt-4 w-full">
          {loading ? '...' : t('placeOrder')}
        </button>
      </div>
    </form>
  );
}
