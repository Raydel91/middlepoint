import { MetadataRoute } from 'next';
import { getPayloadClient } from '@/lib/payload';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = ['', '/productos', '/sobre-nosotros', '/faq', '/login', '/registro'].flatMap((path) =>
    ['es', 'en'].map((locale) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: path === '' ? 1 : 0.8,
    })),
  );

  try {
    const payload = await getPayloadClient();
    const [products, categories] = await Promise.all([
      payload.find({ collection: 'products', where: { activo: { equals: true } }, limit: 500 }),
      payload.find({ collection: 'categories', limit: 100 }),
    ]);

    const productPages = products.docs.flatMap((p) =>
      ['es', 'en'].map((locale) => ({
        url: `${BASE_URL}/${locale}/productos/${p.slug}`,
        lastModified: new Date(p.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    );

    const categoryPages = categories.docs.flatMap((c) =>
      ['es', 'en'].map((locale) => ({
        url: `${BASE_URL}/${locale}/categorias/${c.slug}`,
        lastModified: new Date(c.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
    );

    return [...staticPages, ...productPages, ...categoryPages];
  } catch {
    return staticPages;
  }
}
