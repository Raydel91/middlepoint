import { setRequestLocale } from 'next-intl/server';
import { PageContent } from '@/components/content/PageContent';
import { getAboutPage } from '@/lib/store-content';
import type { Locale } from '@middlepoint/shared';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const page = await getAboutPage(locale as Locale);
  return { title: page.title };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = await getAboutPage(locale as Locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-secondary text-3xl font-bold text-secondary">{page.title}</h1>
      <PageContent content={page.content} />
    </div>
  );
}
