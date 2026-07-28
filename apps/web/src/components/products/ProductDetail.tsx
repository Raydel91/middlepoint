'use client';

import { useTranslations, useLocale } from 'next-intl';
import { getI18nValue, formatCurrency, type Locale } from '@middlepoint/shared';
import { useCart } from '@/components/cart/CartProvider';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductGallery } from '@/components/products/ProductGallery';
import type { ResolvedMedia } from '@/lib/media';
import { getProductCardImageUrl } from '@/lib/media';
import type { Media } from '@/payload-types';
import { useEffect, useState } from 'react';
import { QuantitySelector } from './QuantitySelector';

interface ProductDetailProps {
  product: {
    id: string | number;
    slug: string;
    nombre: { es: string; en: string };
    descripcion: { es: string; en: string };
    ingredientes?: { es: string; en: string };
    precio: number;
    calorias?: number;
    galeria?: (number | Media)[] | null;
  };
  gallery: ResolvedMedia[];
  related: Array<{
    id: string | number;
    slug: string;
    nombre: { es: string; en: string };
    precio: number;
    calorias?: number;
    galeria?: (number | Media)[] | null;
    imagen?: (number | Media) | null;
  }>;
}

export function ProductDetail({ product, gallery, related }: ProductDetailProps) {
  const t = useTranslations('product');
  const locale = useLocale() as Locale;
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetch('/api/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'view_product', productId: product.id }),
    }).catch(() => {});
  }, [product.id]);

  function handleAddToCart() {
    addItem({
      productId: String(product.id),
      quantity,
      price: product.precio,
      name: product.nombre,
    });
    fetch('/api/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'add_to_cart', productId: product.id }),
    }).catch(() => {});
  }

  return (
    <div>
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery items={gallery} alt={getI18nValue(product.nombre, locale)} />
        <div>
          <h1 className="font-secondary text-3xl font-bold">
            {getI18nValue(product.nombre, locale)}
          </h1>
          <p className="mt-4 text-2xl font-bold text-primary">
            {formatCurrency(product.precio, 'DOP', locale)}
          </p>
          {product.calorias && (
            <p className="mt-2 text-secondary/60">
              {product.calorias} {t('calories')}
            </p>
          )}
          <p className="mt-4 text-secondary/80">
            {getI18nValue(product.descripcion, locale)}
          </p>
          {product.ingredientes && (
            <div className="mt-4">
              <h3 className="font-semibold">{t('ingredients')}</h3>
              <p className="text-secondary/70">{getI18nValue(product.ingredientes, locale)}</p>
            </div>
          )}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-secondary/70">{t('quantity')}</span>
              <QuantitySelector value={quantity} onChange={setQuantity} />
            </div>
            <button onClick={handleAddToCart} className="btn-primary w-full sm:w-auto">
              {t('addToCart')}
            </button>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 font-secondary text-2xl font-bold">{t('related')}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                slug={p.slug}
                nombre={p.nombre}
                precio={p.precio}
                calorias={p.calorias}
                imagenUrl={getProductCardImageUrl(p)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
