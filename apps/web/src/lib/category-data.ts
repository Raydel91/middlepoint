import { cache } from 'react';
import { getPayloadClient } from '@/lib/payload';
import { getI18nValue, type Locale } from '@middlepoint/shared';
import { MEDIA_DEPTH, PRODUCT_CARD_SELECT } from '@/lib/query-select';
import { normalizeRouteSlug } from '@/lib/slug';

export const getCategoryPageData = cache(async (slug: string) => {
  const normalizedSlug = normalizeRouteSlug(slug);
  const payload = await getPayloadClient();

  const catResult = await payload.find({
    collection: 'categories',
    where: { slug: { equals: normalizedSlug } },
    limit: 1,
    depth: MEDIA_DEPTH,
  });

  const category = catResult.docs[0];
  if (!category) return null;

  const products = await payload.find({
    collection: 'products',
    where: {
      and: [
        { categoria: { equals: category.id } },
        { activo: { equals: true } },
      ],
    },
    limit: 50,
    depth: MEDIA_DEPTH,
    select: PRODUCT_CARD_SELECT,
  });

  return { category, products: products.docs };
});

export async function getCategoryMetadata(slug: string, locale: Locale) {
  const normalizedSlug = normalizeRouteSlug(slug);
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'categories',
    where: { slug: { equals: normalizedSlug } },
    limit: 1,
    depth: 0,
    select: { nombre: true, descripcion: true },
  });
  const cat = result.docs[0];
  if (!cat) return null;
  return {
    title: getI18nValue(cat.nombre, locale),
    description: getI18nValue(cat.descripcion, locale),
  };
}
