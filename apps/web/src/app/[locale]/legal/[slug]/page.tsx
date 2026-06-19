import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PageContent } from '@/components/content/PageContent';
import { getLegalPage, type LegalSlug } from '@/lib/store-content';
import type { Locale } from '@middlepoint/shared';
import type { Metadata } from 'next';

const PAGES: LegalSlug[] = ['terminos', 'privacidad', 'devoluciones'];

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!PAGES.includes(slug as LegalSlug)) return {};
  const page = await getLegalPage(slug as LegalSlug, locale as Locale);
  return { title: page.title };
}

export default async function LegalPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  if (!PAGES.includes(slug as LegalSlug)) notFound();

  const page = await getLegalPage(slug as LegalSlug, locale as Locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-secondary text-3xl font-bold text-secondary">{page.title}</h1>
      {page.updated && (
        <p className="mt-2 text-sm text-secondary/60">{page.updated}</p>
      )}
      <PageContent content={page.content} />
    </div>
  );
}
