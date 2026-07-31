import { notFound } from 'next/navigation';
import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { ProductCard } from '@/components/products/ProductCard';
import { getI18nValue, type Locale } from '@middlepoint/shared';
import { getCategoryImageUrl, getProductCardImageUrl } from '@/lib/media';
import { getCategoryPageData, getCategoryMetadata } from '@/lib/category-data';
import { buildCategoryJsonLd, JsonLdScript } from '@/lib/seo';
import type { Metadata } from 'next';
import { Instagram } from 'lucide-react';

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const meta = await getCategoryMetadata(slug, locale as Locale);
  if (!meta) return { title: 'Categoría' };
  return meta;
}

export default async function CategoryPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const data = await getCategoryPageData(slug);
  if (!data) notFound();

  const { category, products } = data;

  const name = getI18nValue(category.nombre, locale as Locale);
  const description = getI18nValue(category.descripcion, locale as Locale);
  const imagenUrl = getCategoryImageUrl(category.imagen);
  const jsonLd = buildCategoryJsonLd({
    locale: locale as Locale,
    name,
    description,
    slug: category.slug,
    imageUrl: imagenUrl,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <JsonLdScript data={jsonLd} />
      <header className="mb-8">
        <div className="flex items-center justify-between gap-6">
          <h1 className="font-secondary text-3xl font-bold text-secondary md:text-4xl">
            {name}
          </h1>
          {imagenUrl && (
            <div className="relative h-16 w-16 shrink-0 md:h-20 md:w-20">
              <Image
                src={imagenUrl}
                alt={name}
                width={80}
                height={80}
                className="h-full w-full object-contain"
                priority
              />
            </div>
          )}
        </div>
        {description && (
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-secondary/75 md:text-lg">
            {description}
          </p>
        )}
        { (category.social?.instagram_url || category.instagram_url) && (
          <a
            href={category.social?.instagram_url || category.instagram_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2.5 text-sm font-medium text-primary transition hover:underline"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-white">
              <Instagram size={14} />
            </span>
            <span>
              {name}
              <span className="ml-1 font-normal text-secondary/50">· Instagram</span>
            </span>
          </a>
        )}
      </header>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              slug={product.slug}
              nombre={product.nombre}
              precio={product.precio}
              calorias={product.calorias ?? undefined}
              imagenUrl={getProductCardImageUrl(product)}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-primary/15 bg-white/60 px-6 py-10 text-center text-secondary/60">
          {locale === 'es'
            ? 'No hay productos en esta categoría por ahora.'
            : 'No products in this category yet.'}
        </p>
      )}
    </div>
  );
}
