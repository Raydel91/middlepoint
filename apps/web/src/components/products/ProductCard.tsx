'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { MediaImage } from '@/components/media/MediaImage';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { getI18nValue, formatCurrency, type Locale } from '@middlepoint/shared';
import type { I18nField } from '@middlepoint/shared';
import { useCart } from '@/components/cart/CartProvider';
import { QuantitySelector } from './QuantitySelector';

interface ProductCardProps {
  id: string | number;
  slug: string;
  nombre: I18nField;
  precio: number;
  imagenUrl?: string;
  calorias?: number;
  currency?: 'DOP' | 'USD';
}

export function ProductCard({
  id,
  slug,
  nombre,
  precio,
  imagenUrl,
  calorias,
  currency = 'DOP',
}: ProductCardProps) {
  const t = useTranslations('product');
  const locale = useLocale() as Locale;
  const { addItem } = useCart();
  const { status } = useSession();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const isLoggedIn = status === 'authenticated';

  function handleAddToCart() {
    addItem({
      productId: String(id),
      quantity,
      price: precio,
      name: nombre,
    });
    fetch('/api/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'add_to_cart', productId: id }),
    }).catch(() => {});
    setAdded(true);
    setQuantity(1);
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <article className="card flex h-full flex-col overflow-hidden transition hover:shadow-lg">
      <Link
        href={`/productos/${encodeURIComponent(slug)}`}
        className="group block flex-1"
      >
        <div className="relative aspect-square bg-background">
          {imagenUrl ? (
            <MediaImage
              src={imagenUrl}
              alt={getI18nValue(nombre, locale)}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="(max-width:768px) 50vw, 25vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-primary/30">
              <span className="text-4xl">🌿</span>
            </div>
          )}
        </div>
        <div className="p-4 pb-0">
          <h3 className="font-secondary font-semibold text-secondary line-clamp-2">
            {getI18nValue(nombre, locale)}
          </h3>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-lg font-bold text-primary">
              {formatCurrency(precio, currency, locale)}
            </span>
            {calorias ? (
              <span className="text-xs text-secondary/60">
                {calorias} {t('calories').toLowerCase()}
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {isLoggedIn && (
        <div className="mt-3 flex items-center gap-2 p-4 pt-0">
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
            size="sm"
            className="flex-1"
          />
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition hover:opacity-90"
            aria-label={t('addToCart')}
            title={added ? t('addedToCart') : t('addToCart')}
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      )}
    </article>
  );
}
