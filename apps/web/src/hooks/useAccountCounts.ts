'use client';

import { useCallback, useEffect, useState } from 'react';

type AccountCounts = {
  notifications: number;
  messages: number;
};

export function useAccountCounts(enabled: boolean) {
  const [counts, setCounts] = useState<AccountCounts>({ notifications: 0, messages: 0 });

  const refresh = useCallback(() => {
    if (!enabled) return;
    fetch('/api/account/counts')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setCounts({
            notifications: data.notifications ?? 0,
            messages: data.messages ?? 0,
          });
        }
      })
      .catch(() => {});
  }, [enabled]);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener('account-counts-changed', handler);
    return () => window.removeEventListener('account-counts-changed', handler);
  }, [refresh]);

  return counts;
}

export function notifyAccountCountsChanged() {
  window.dispatchEvent(new CustomEvent('account-counts-changed'));
}
