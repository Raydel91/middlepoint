'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatCurrency } from '@middlepoint/shared';
import type { AnalyticsKPIs } from '@middlepoint/shared';

export function AnalyticsDashboard() {
  const t = useTranslations('dashboard');
  const [kpis, setKpis] = useState<AnalyticsKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then(setKpis)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>{t('analytics')}...</p>;
  if (!kpis) return <p>Error loading analytics</p>;

  const cards = [
    { label: t('totalSales'), value: formatCurrency(kpis.totalSales, 'DOP') },
    { label: t('avgTicket'), value: formatCurrency(kpis.avgTicket, 'DOP') },
    { label: t('conversion'), value: `${(kpis.conversionRate * 100).toFixed(2)}%` },
    { label: t('ltv'), value: formatCurrency(kpis.ltv, 'DOP') },
    { label: t('frequency'), value: kpis.purchaseFrequency.toFixed(2) },
    { label: t('cac'), value: kpis.cac ? formatCurrency(kpis.cac, 'DOP') : 'N/A' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="card p-6">
          <p className="text-sm text-secondary/60">{card.label}</p>
          <p className="mt-1 text-2xl font-bold text-primary">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
