'use client';

import { MediaImage } from '@/components/media/MediaImage';
import { Link } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { getI18nValue, formatCurrency, type Locale } from '@middlepoint/shared';
import type { I18nField } from '@middlepoint/shared';

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
  slug,
  nombre,
  precio,
  imagenUrl,
  calorias,
  currency = 'DOP',
}: ProductCardProps) {
  const t = useTranslations('product');
  const locale = useLocale() as Locale;

  return (
    <Link href={`/productos/${encodeURIComponent(slug)}`} className="card group overflow-hidden transition hover:shadow-lg">
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
      <div className="p-4">
        <h3 className="font-secondary font-semibold text-secondary line-clamp-2">
          {getI18nValue(nombre, locale)}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            {formatCurrency(precio, currency, locale)}
          </span>
          {calorias && (
            <span className="text-xs text-secondary/60">
              {calorias} {t('calories').toLowerCase()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
