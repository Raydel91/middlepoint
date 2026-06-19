import { cache } from 'react';
import { getServices } from '@/lib/payload';

export const getProductPageData = cache(async (slug: string) => {
  const services = await getServices();
  const product = await services.product.getBySlug(slug);
  if (!product || !product.activo) return null;

  const categoryId =
    typeof product.categoria === 'object' ? product.categoria?.id : product.categoria;

  const related = categoryId
    ? await services.product.getRelated(product.id, categoryId)
    : [];

  return { product, related };
});
