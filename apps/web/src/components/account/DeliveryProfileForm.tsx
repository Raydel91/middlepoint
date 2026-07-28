'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import type { UserDeliveryProfile } from '@/lib/user-delivery-profile';

type Labels = {
  title: string;
  addressTitle: string;
  street: string;
  city: string;
  province: string;
  reference: string;
  secondaryTitle: string;
  secondaryHint: string;
  name: string;
  phone: string;
  email: string;
  save: string;
  success: string;
  error: string;
};

type Props = {
  initial: UserDeliveryProfile;
  labels: Labels;
};

export function DeliveryProfileForm({ initial, labels }: Props) {
  const router = useRouter();
  const [street, setStreet] = useState(initial.address.street);
  const [city, setCity] = useState(initial.address.city);
  const [province, setProvince] = useState(initial.address.province);
  const [reference, setReference] = useState(initial.address.reference || '');
  const [secondaryName, setSecondaryName] = useState(initial.contactSecondary?.name || '');
  const [secondaryPhone, setSecondaryPhone] = useState(initial.contactSecondary?.phone || '');
  const [secondaryEmail, setSecondaryEmail] = useState(initial.contactSecondary?.email || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const hasSecondary = secondaryName.trim() || secondaryPhone.trim() || secondaryEmail.trim();

    try {
      const res = await fetch('/api/account/delivery-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: {
            street: street.trim(),
            city: city.trim(),
            province: province.trim(),
            reference: reference.trim() || undefined,
          },
          contactSecondary: hasSecondary
            ? {
                name: secondaryName.trim(),
                phone: secondaryPhone.trim(),
                email: secondaryEmail.trim() || undefined,
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || labels.error);

      setMessage({ type: 'success', text: labels.success });
      router.refresh();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : labels.error,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      <h2 className="font-secondary text-xl font-semibold text-secondary">{labels.title}</h2>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-secondary">{labels.addressTitle}</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder={labels.street}
            required
            minLength={3}
            className="input-field md:col-span-2"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={labels.city}
            required
            minLength={2}
            className="input-field"
          />
          <input
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            placeholder={labels.province}
            required
            minLength={2}
            className="input-field"
          />
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder={labels.reference}
            className="input-field md:col-span-2"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-sm font-semibold text-secondary">{labels.secondaryTitle}</h3>
        <p className="mb-3 text-xs text-secondary/60">{labels.secondaryHint}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={secondaryName}
            onChange={(e) => setSecondaryName(e.target.value)}
            placeholder={labels.name}
            className="input-field"
          />
          <input
            value={secondaryPhone}
            onChange={(e) => setSecondaryPhone(e.target.value)}
            type="tel"
            inputMode="tel"
            placeholder={labels.phone}
            className="input-field"
          />
          <input
            value={secondaryEmail}
            onChange={(e) => setSecondaryEmail(e.target.value)}
            type="email"
            placeholder={labels.email}
            className="input-field md:col-span-2"
          />
        </div>
      </div>

      {message && (
        <p
          className={`text-sm ${message.type === 'success' ? 'text-primary' : 'text-red-600'}`}
          role="status"
        >
          {message.text}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? '...' : labels.save}
      </button>
    </form>
  );
}
