'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useListQuery } from '@payloadcms/ui';

/**
 * Payload solo re-fetcha la lista si cambia la URL.
 * `refineListData({ ...query })` no hace nada cuando la query es idéntica.
 */
export function useForceListRefresh() {
  const router = useRouter();
  const { refineListData, query } = useListQuery();

  return useCallback(async () => {
    await refineListData({
      ...query,
      // Cache-bust: fuerza router.replace y recarga de la tabla.
      refresh: Date.now(),
    } as typeof query);
    router.refresh();
  }, [refineListData, query, router]);
}
