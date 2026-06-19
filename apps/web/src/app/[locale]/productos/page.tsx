import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getPayloadClient } from '@/lib/payload';
import { ProductCard } from '@/components/products/ProductCard';
import type { Media } from '@/payload-types';
import type { Where } from 'payload';
import { MEDIA_DEPTH, PRODUCT_CARD_SELECT } from '@/lib/query-select';
import { getProductCardImageUrl } from '@/lib/media';

export const revalidate = 30;

type ProductSection = 'mas-vendidos' | 'combos' | 'destacados';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ seccion?: string }>;
};

function resolveSectionQuery(seccion?: string): ProductSection | null {
  if (seccion === 'mas-vendidos' || seccion === 'combos' || seccion === 'destacados') {
    return seccion;
  }
  return null;
}

export default async function ProductsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { seccion } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('nav');
  const tHome = await getTranslations('home');
  const section = resolveSectionQuery(seccion);

  let docs: Array<{
    id: string | number;
    slug: string;
    nombre: { es: string; en: string };
    precio: number;
    calorias?: number | null;
    galeria?: (number | Media)[] | null;
    imagen?: (number | Media) | null;
  }> = [];

  let where: Where = { activo: { equals: true } };
  if (section === 'combos') {
    where = {
      and: [{ activo: { equals: true } }, { 'atributos.isCombo': { equals: true } }],
    };
  } else if (section === 'destacados') {
    where = {
      and: [{ activo: { equals: true } }, { featured: { equals: true } }],
    };
  }

  const titleBySection: Record<ProductSection, string> = {
    'mas-vendidos': tHome('bestSellers'),
    combos: tHome('combos'),
    destacados: tHome('featured'),
  };

  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'products',
      where,
      limit: 50,
      sort: '-sales_count',
      depth: MEDIA_DEPTH,
      select: PRODUCT_CARD_SELECT,
    });
    docs = result.docs as typeof docs;
  } catch {
    /* DB unavailable */
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 font-secondary text-3xl font-bold">
        {section ? titleBySection[section] : t('products')}
      </h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {docs.map((product) => (
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
    </div>
  );
}
