'use client';

import { Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
  size?: 'sm' | 'md';
};

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  className,
  size = 'md',
}: Props) {
  const t = useTranslations('product');
  const compact = size === 'sm';

  function decrement() {
    onChange(Math.max(min, value - 1));
  }

  function increment() {
    onChange(Math.min(max, value + 1));
  }

  return (
    <div
      className={cn(
        'flex items-center rounded-lg border border-primary/20 bg-white',
        compact ? 'h-9' : 'h-11',
        className,
      )}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        className={cn(
          'flex items-center justify-center text-secondary transition hover:bg-primary/10 disabled:opacity-30',
          compact ? 'h-9 w-8' : 'h-11 w-10',
        )}
        aria-label={t('decreaseQuantity')}
      >
        <Minus size={compact ? 14 : 16} />
      </button>
      <span
        className={cn(
          'min-w-[2rem] text-center font-semibold text-secondary',
          compact ? 'text-sm' : 'text-base',
        )}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        className={cn(
          'flex items-center justify-center text-secondary transition hover:bg-primary/10 disabled:opacity-30',
          compact ? 'h-9 w-8' : 'h-11 w-10',
        )}
        aria-label={t('increaseQuantity')}
      >
        <Plus size={compact ? 14 : 16} />
      </button>
    </div>
  );
}
