import { cache } from 'react';
import { getServices } from '@/lib/payload';

export const HOME_PRODUCT_LIMIT = 5;

export const getHomeCatalog = cache(async () => {
  const services = await getServices();
  const limit = HOME_PRODUCT_LIMIT;
  const [categories, bestSellers, featured, combos, recommended] = await Promise.all([
    services.product.getCategories(),
    services.product.getBestSellers(limit),
    services.product.getFeatured(limit),
    services.product.getCombos(limit),
    services.recommendation.getFallback(limit),
  ]);
  return { categories, bestSellers, featured, combos, recommended };
});
