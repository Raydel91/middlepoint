import { cache } from 'react';
import { getPayloadClient } from '@/lib/payload';
import { getI18nValue, type Locale } from '@middlepoint/shared';
import { MEDIA_DEPTH, PRODUCT_CARD_SELECT } from '@/lib/query-select';
import { normalizeRouteSlug } from '@/lib/slug';
import { buildPageMetadata } from '@/lib/seo';
import { getCategoryImageUrl } from '@/lib/media';

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
    depth: 1,
    select: {
      nombre: true,
      descripcion: true,
      slug: true,
      imagen: true,
      seo: true,
    },
  });
  const cat = result.docs[0];
  if (!cat) return null;

  const name = getI18nValue(cat.nombre, locale);
  const description = getI18nValue(cat.descripcion, locale);

  return buildPageMetadata({
    locale,
    seo: cat.seo,
    fallbackTitle: name,
    fallbackDescription: description,
    fallbackImageUrl: getCategoryImageUrl(cat.imagen),
    path: `/${locale}/categorias/${cat.slug}`,
    alternates: {
      languages: {
        es: `/es/categorias/${cat.slug}`,
        en: `/en/categorias/${cat.slug}`,
      },
    },
  });
}

/** Categorías con Instagram para el footer. */
export const getCategoryInstagramLinks = cache(async (locale: Locale) => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'categories',
    where: { instagram_url: { exists: true } },
    sort: 'orden',
    limit: 20,
    depth: 0,
    select: { nombre: true, instagram_url: true, slug: true },
  });

  return result.docs
    .filter((cat) => Boolean(cat.instagram_url?.trim()))
    .map((cat) => ({
      label: getI18nValue(cat.nombre, locale),
      url: cat.instagram_url!.trim(),
      slug: cat.slug,
    }));
});
