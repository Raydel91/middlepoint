'use client';

import { useTranslations } from 'next-intl';
import { getI18nValue, formatCurrency, type Locale } from '@middlepoint/shared';
import { useCart } from '@/components/cart/CartProvider';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Minus, Plus, Trash2 } from 'lucide-react';

export function CartView() {
  const t = useTranslations('cart');
  const locale = useLocale() as Locale;
  const { items, removeItem, updateQuantity, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-secondary/60">{t('empty')}</p>
        <Link href="/" className="btn-primary mt-4 inline-block">
          {t('checkout')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.productId} className="card flex items-center gap-4 p-4">
          <div className="flex-1">
            <h3 className="font-semibold">{getI18nValue(item.name, locale)}</h3>
            <p className="text-primary">{formatCurrency(item.price, 'DOP', locale)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))}
              className="rounded-lg p-1 hover:bg-background"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              className="rounded-lg p-1 hover:bg-background"
            >
              <Plus size={16} />
            </button>
          </div>
          <button onClick={() => removeItem(item.productId)} className="text-red-500 hover:text-red-700">
            <Trash2 size={18} />
          </button>
        </div>
      ))}
      <div className="card p-4">
        <div className="flex justify-between text-lg font-bold">
          <span>{t('subtotal')}</span>
          <span className="text-primary">{formatCurrency(total, 'DOP', locale)}</span>
        </div>
        <Link href="/checkout" className="btn-primary mt-4 block w-full text-center">
          {t('checkout')}
        </Link>
      </div>
    </div>
  );
}
