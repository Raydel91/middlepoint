'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';
import { PasswordInput } from '@/components/ui/PasswordInput';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const password = form.get('password') as string;
    const confirm = form.get('confirmPassword') as string;

    if (password !== confirm) {
      setError(t('passwordMismatch'));
      setLoading(false);
      return;
    }

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: form.get('nombre'),
        apellido: form.get('apellido'),
        email: form.get('email'),
        telefono: form.get('telefono'),
        password,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || t('registerError'));
      setLoading(false);
      return;
    }

    router.push('/login');
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-8 text-center font-secondary text-3xl font-bold">{t('registerTitle')}</h1>
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        {error && <div className="rounded-lg bg-red-50 p-3 text-red-700">{error}</div>}
        <input name="nombre" placeholder={t('firstName')} required className="input-field" />
        <input name="apellido" placeholder={t('lastName')} required className="input-field" />
        <input name="email" type="email" placeholder={t('email')} required className="input-field" />
        <input name="telefono" placeholder={t('phone')} className="input-field" />
        <PasswordInput
          name="password"
          placeholder={t('password')}
          required
          minLength={8}
          autoComplete="new-password"
          revealLabel={tc('showPassword')}
          hideLabel={tc('hidePassword')}
        />
        <PasswordInput
          name="confirmPassword"
          placeholder={t('confirmPassword')}
          required
          minLength={8}
          autoComplete="new-password"
          revealLabel={tc('showPassword')}
          hideLabel={tc('hidePassword')}
        />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? '...' : t('submitRegister')}
        </button>
        <p className="text-center text-sm">
          {t('hasAccount')}{' '}
          <Link href="/login" className="text-primary hover:underline">
            {t('submitLogin')}
          </Link>
        </p>
      </form>
    </div>
  );
}
