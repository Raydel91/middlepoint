'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { PasswordInput } from '@/components/ui/PasswordInput';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const result = await signIn('credentials', {
      email: form.get('email') as string,
      password: form.get('password') as string,
      redirect: false,
    });

    if (result?.error) {
      setError(t('invalidCredentials'));
      setLoading(false);
      return;
    }

    window.location.href = callbackUrl;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-8 text-center font-secondary text-3xl font-bold">{t('loginTitle')}</h1>
      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        {error && <div className="rounded-lg bg-red-50 p-3 text-red-700">{error}</div>}
        <input name="email" type="email" placeholder={t('email')} required className="input-field" />
        <PasswordInput
          name="password"
          placeholder={t('password')}
          required
          autoComplete="current-password"
          revealLabel={tc('showPassword')}
          hideLabel={tc('hidePassword')}
        />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? '...' : t('submitLogin')}
        </button>
        <p className="text-center text-sm">
          {t('noAccount')}{' '}
          <Link href="/registro" className="text-primary hover:underline">
            {t('submitRegister')}
          </Link>
        </p>
      </form>
    </div>
  );
}
