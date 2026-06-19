import { ProductCard } from '@/components/products/ProductCard';
import { Link } from '@/i18n/routing';
import { getProductCardImageUrl } from '@/lib/media';
import type { Media } from '@/payload-types';

export type HomeProduct = {
  id: string | number;
  slug: string;
  nombre: { es: string; en: string };
  precio: number;
  calorias?: number | null;
  galeria?: (number | Media)[] | null;
  imagen?: (number | Media) | null;
};

type Props = {
  title: string;
  seeMoreHref: string;
  seeMoreLabel: string;
  products: HomeProduct[];
};

export function HomeProductSection({ title, seeMoreHref, seeMoreLabel, products }: Props) {
  if (products.length === 0) return null;

  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="font-secondary text-2xl font-bold text-secondary">{title}</h2>
        <Link
          href={seeMoreHref}
          className="shrink-0 text-sm font-semibold text-primary transition hover:text-primary/80"
        >
          {seeMoreLabel} →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
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
    </section>
  );
}
