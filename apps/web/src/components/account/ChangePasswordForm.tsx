'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PasswordInput } from '@/components/ui/PasswordInput';

type Labels = {
  title: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  save: string;
  success: string;
  error: string;
  mismatch: string;
  invalidCurrent: string;
};

type Props = {
  labels: Labels;
};

export function ChangePasswordForm({ labels }: Props) {
  const tc = useTranslations('common');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: labels.mismatch });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/account/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'INVALID_PASSWORD') throw new Error(labels.invalidCurrent);
        if (data.code === 'PASSWORD_MISMATCH') throw new Error(labels.mismatch);
        throw new Error(data.error || labels.error);
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: labels.success });
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

      <div className="space-y-4">
        <PasswordInput
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder={labels.currentPassword}
          required
          minLength={6}
          autoComplete="current-password"
          revealLabel={tc('showPassword')}
          hideLabel={tc('hidePassword')}
        />
        <PasswordInput
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder={labels.newPassword}
          required
          minLength={8}
          autoComplete="new-password"
          revealLabel={tc('showPassword')}
          hideLabel={tc('hidePassword')}
        />
        <PasswordInput
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={labels.confirmPassword}
          required
          minLength={8}
          autoComplete="new-password"
          revealLabel={tc('showPassword')}
          hideLabel={tc('hidePassword')}
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
