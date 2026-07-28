'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import type { UserAccountProfile } from '@/lib/user-delivery-profile';

type Labels = {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  memberSince: string;
  save: string;
  success: string;
  error: string;
  invalidPhone: string;
  emailInUse: string;
};

type Props = {
  initial: UserAccountProfile;
  labels: Labels;
};

export function AccountProfileForm({ initial, labels }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const { update: updateSession } = useSession();
  const [nombre, setNombre] = useState(initial.nombre);
  const [apellido, setApellido] = useState(initial.apellido);
  const [email, setEmail] = useState(initial.email);
  const [telefono, setTelefono] = useState(initial.telefono);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const memberSince = initial.createdAt
    ? new Date(initial.createdAt).toLocaleDateString(locale === 'es' ? 'es-DO' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, apellido, email, telefono: telefono || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'EMAIL_IN_USE') throw new Error(labels.emailInUse);
        if (data.code === 'VALIDATION_ERROR') throw new Error(labels.invalidPhone);
        throw new Error(data.error || labels.error);
      }

      setNombre(data.nombre);
      setApellido(data.apellido);
      setEmail(data.email);
      setTelefono(data.telefono || '');

      await updateSession({
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
      });

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
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <h2 className="font-secondary text-xl font-semibold text-secondary">{labels.title}</h2>

      {memberSince && (
        <p className="text-sm text-secondary/60">
          {labels.memberSince}: {memberSince}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={labels.firstName}
          required
          minLength={2}
          className="input-field"
        />
        <input
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          placeholder={labels.lastName}
          required
          minLength={2}
          className="input-field"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={labels.email}
          required
          className="input-field md:col-span-2"
        />
        <input
          type="tel"
          inputMode="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder={labels.phone}
          className="input-field md:col-span-2"
        />
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
