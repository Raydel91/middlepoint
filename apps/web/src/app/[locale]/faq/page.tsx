import { setRequestLocale } from 'next-intl/server';
import { getFaqPage } from '@/lib/store-content';
import type { Locale } from '@middlepoint/shared';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const page = await getFaqPage(locale as Locale);
  return { title: page.title };
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = await getFaqPage(locale as Locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-secondary text-3xl font-bold text-secondary">{page.title}</h1>
      <div className="mt-8 space-y-6">
        {page.items.map((item, index) => (
          <div key={index} className="card p-6">
            <h2 className="font-semibold text-primary">{item.question}</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-secondary/80">
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
