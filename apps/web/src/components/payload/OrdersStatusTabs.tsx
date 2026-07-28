'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { OrderStatus, UserRole } from '@middlepoint/shared';
import { isDeliveryRole } from '@middlepoint/shared';
import { useAuth, useListQuery } from '@payloadcms/ui';
import {
  buildWhereForStatusTab,
  DELIVERY_ORDER_LIST_TABS,
  ORDER_LIST_TABS,
  parseStatusTabFromWhere,
} from '@/lib/order-status-workflow';

export function OrdersStatusTabs() {
  const { user } = useAuth();
  const { refineListData, query } = useListQuery();
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');

  const tabs = useMemo(() => {
    const role = user?.role as UserRole | undefined;
    return isDeliveryRole(role) ? DELIVERY_ORDER_LIST_TABS : ORDER_LIST_TABS;
  }, [user?.role]);

  useEffect(() => {
    const tab = parseStatusTabFromWhere(query.where);
    const allowed = tabs.some((t) => t.id === tab);
    setActiveTab(allowed ? tab : 'all');
  }, [query.where, tabs]);

  const selectTab = useCallback(
    async (tab: OrderStatus | 'all') => {
      setActiveTab(tab);
      await refineListData({
        ...query,
        page: 1,
        where: buildWhereForStatusTab(tab) as typeof query.where,
      });
    },
    [query, refineListData],
  );

  return (
    <div className="mp-status-tabs">
      <nav className="mp-status-tabs__nav" aria-label="Filtrar pedidos por estado">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => selectTab(tab.id)}
              className={`mp-status-tabs__tab${isActive ? ' mp-status-tabs__tab--active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
