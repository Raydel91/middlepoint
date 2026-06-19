import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { getI18nValue, type I18nField, type Locale } from '@middlepoint/shared';

type Props = {
  slug: string;
  nombre: I18nField;
  imagenUrl?: string;
  locale: Locale;
};

export function CategoryCard({ slug, nombre, imagenUrl, locale }: Props) {
  const name = getI18nValue(nombre, locale);

  return (
    <Link
      href={`/categorias/${encodeURIComponent(slug)}`}
      className="card group flex flex-col items-center p-6 text-center transition hover:shadow-lg"
    >
      <div className="relative mb-4 flex h-20 w-20 items-center justify-center">
        {imagenUrl ? (
          <Image
            src={imagenUrl}
            alt={name}
            width={80}
            height={80}
            className="h-20 w-20 object-contain transition group-hover:scale-105"
            sizes="80px"
          />
        ) : (
          <span className="text-4xl" aria-hidden="true">
            🌿
          </span>
        )}
      </div>
      <h3 className="font-semibold text-secondary">{name}</h3>
    </Link>
  );
}
