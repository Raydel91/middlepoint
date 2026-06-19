import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { ProductDetail } from '@/components/products/ProductDetail';
import { getI18nValue, type Locale } from '@middlepoint/shared';
import { resolveProductGallery } from '@/lib/media';
import { getProductPageData } from '@/lib/product-data';
import { getServices } from '@/lib/payload';
import type { Metadata } from 'next';

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  try {
    const services = await getServices();
    const product = await services.product.getBySlug(slug);
    if (!product) return { title: 'Producto no encontrado' };
    return {
      title: getI18nValue(product.nombre, locale as Locale),
      description: getI18nValue(product.descripcion, locale as Locale),
      alternates: {
        languages: { es: `/es/productos/${slug}`, en: `/en/productos/${slug}` },
      },
    };
  } catch {
    return { title: slug };
  }
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  try {
    const data = await getProductPageData(slug);
    if (!data) notFound();

    const { product, related } = data;

    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <ProductDetail
          product={product as Parameters<typeof ProductDetail>[0]['product']}
          gallery={resolveProductGallery(product)}
          related={related as Parameters<typeof ProductDetail>[0]['related']}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
