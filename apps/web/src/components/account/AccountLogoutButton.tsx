'use client';

import { signOut } from 'next-auth/react';
import { useLocale } from 'next-intl';
import { LogOut } from 'lucide-react';

type Props = {
  label: string;
};

export function AccountLogoutButton({ label }: Props) {
  const locale = useLocale();

  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: `/${locale}` })}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 sm:w-auto"
    >
      <LogOut size={18} />
      {label}
    </button>
  );
}
