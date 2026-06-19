import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { type Locale } from '@middlepoint/shared';
import { getStoreContent } from '@/lib/store-content';
import { getHomeCatalog } from '@/lib/home-data';
import { getApprovedReviews } from '@/lib/cached-reviews';
import { mapReviewForDisplay } from '@/lib/review-display';
import { ReviewsSection } from '@/components/reviews/ReviewCard';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { HomeProductSection } from '@/components/home/HomeProductSection';
import { getCategoryImageUrl } from '@/lib/media';
import type { Media } from '@/payload-types';

export const revalidate = 30;

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const content = await getStoreContent(locale as Locale);

  let categories: Array<{
    id: string | number;
    slug: string;
    nombre: { es: string; en: string };
    imagen?: (number | null) | Media;
  }> = [];
  let recommended: Parameters<typeof HomeProductSection>[0]['products'] = [];
  let bestSellers = recommended;
  let combos = recommended;
  let featured = recommended;
  let reviews: ReturnType<typeof mapReviewForDisplay>[] = [];

  try {
    const [catalog, reviewDocs] = await Promise.all([getHomeCatalog(), getApprovedReviews()]);
    categories = catalog.categories as typeof categories;
    recommended = catalog.recommended as typeof recommended;
    bestSellers = catalog.bestSellers as typeof recommended;
    combos = catalog.combos as typeof recommended;
    featured = catalog.featured as typeof recommended;
    reviews = reviewDocs.map((doc) => mapReviewForDisplay(doc as Parameters<typeof mapReviewForDisplay>[0]));
  } catch {
    /* DB unavailable at build/runtime */
  }

  const productSections = [
    { title: t('recommended'), products: recommended, seeMoreHref: '/productos' as const },
    { title: t('bestSellers'), products: bestSellers, seeMoreHref: '/productos?seccion=mas-vendidos' as const },
    { title: t('combos'), products: combos, seeMoreHref: '/productos?seccion=combos' as const },
    { title: t('featured'), products: featured, seeMoreHref: '/productos?seccion=destacados' as const },
  ];

  return (
    <div>
      <section className="bg-gradient-to-br from-primary to-primary/80 px-4 py-16 text-white">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="font-secondary text-4xl font-bold md:text-5xl">{content.home.heroTitle}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">{content.home.heroSubtitle}</p>
          <Link href="/productos" className="btn-secondary mt-8 inline-block bg-white text-primary hover:bg-white/90">
            {content.home.shopNow}
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-12">
        {categories.length > 0 && (
          <section>
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 className="font-secondary text-2xl font-bold text-secondary">{t('categories')}</h2>
              <Link
                href="/productos"
                className="shrink-0 text-sm font-semibold text-primary transition hover:text-primary/80"
              >
                {t('seeMore')} →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  slug={cat.slug}
                  nombre={cat.nombre}
                  imagenUrl={getCategoryImageUrl(cat.imagen)}
                  locale={locale as Locale}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <ReviewsSection
        title={content.home.reviewsTitle}
        subtitle={content.home.reviewsSubtitle}
        reviews={reviews}
        googleReviewsUrl={content.home.googleReviewsUrl}
        googleReviewsLabel={content.home.googleReviewsLabel}
      />

      <div className="mx-auto max-w-7xl space-y-12 px-4 pb-12">
        {productSections.map((section) => (
          <HomeProductSection
            key={section.title}
            title={section.title}
            seeMoreHref={section.seeMoreHref}
            seeMoreLabel={t('seeMore')}
            products={section.products}
          />
        ))}
      </div>
    </div>
  );
}
