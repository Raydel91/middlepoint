'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useConfig } from '@payloadcms/ui';

export default function AdminLogoutButton() {
  const { logOut } = useAuth();
  const { config } = useConfig();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const adminRoute = config?.routes?.admin ?? '/admin';
  const loginRoute = config?.admin?.routes?.login ?? '/login';
  const loginUrl = `${adminRoute}${loginRoute}`;

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await logOut();
    } catch {
      /* si falla el hook, forzamos la navegación al logout de Payload */
      window.location.href = `${adminRoute}/logout`;
      return;
    }
    router.push(loginUrl);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="mp-admin-logout"
      aria-label="Cerrar sesión"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span>{loading ? 'Cerrando sesión…' : 'Cerrar sesión'}</span>
    </button>
  );
}
