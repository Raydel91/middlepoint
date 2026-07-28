'use client';

import type { DefaultCellComponentProps } from 'payload';
import { formatCurrency } from '@middlepoint/shared';

export function OrderTotalCell({ rowData }: DefaultCellComponentProps) {
  const total = rowData.total as number | undefined;
  const currency = (rowData.currency as 'DOP' | 'USD' | undefined) || 'DOP';

  if (typeof total !== 'number') return <span>—</span>;

  return <span>{formatCurrency(total, currency, 'es')}</span>;
}
