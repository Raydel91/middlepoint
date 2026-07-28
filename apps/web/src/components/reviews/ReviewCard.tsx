'use client';

import { Star } from 'lucide-react';
import { useLocale } from 'next-intl';
import { MediaImage } from '@/components/media/MediaImage';
import { ReviewsCarousel } from './ReviewsCarousel';
import { GoogleReviewButton } from './GoogleReviewButton';

export type ReviewItem = {
  id: string | number;
  author_name: string;
  rating: number;
  comment: string;
  createdAt: string;
  avatarUrl?: string;
};

export function ReviewCard({ review }: { review: ReviewItem }) {
  const locale = useLocale();
  const date = new Date(review.createdAt).toLocaleDateString(locale === 'es' ? 'es-DO' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const initials = review.author_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <article className="card flex h-full flex-col p-6">
      <div className="mb-3 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < review.rating ? 'fill-premium text-premium' : 'text-secondary/20'}
          />
        ))}
      </div>
      <p className="flex-1 text-sm leading-relaxed text-secondary/80">&ldquo;{review.comment}&rdquo;</p>
      <footer className="mt-4 flex items-center gap-3 border-t border-primary/10 pt-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-primary/10">
          {review.avatarUrl ? (
            <MediaImage
              src={review.avatarUrl}
              alt={review.author_name}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-bold text-primary">
              {initials || '?'}
            </span>
          )}
        </div>
        <div>
          <p className="font-semibold text-secondary">{review.author_name}</p>
          <p className="text-xs text-secondary/50">{date}</p>
        </div>
      </footer>
    </article>
  );
}

export function ReviewsSection({
  title,
  subtitle,
  reviews,
  googleReviewsUrl,
  googleReviewsLabel,
}: {
  title: string;
  subtitle: string;
  reviews: ReviewItem[];
  googleReviewsUrl?: string;
  googleReviewsLabel?: string;
}) {
  const hasGoogleLink = Boolean(googleReviewsUrl?.trim());
  if (reviews.length === 0 && !hasGoogleLink) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 text-center">
        <h2 className="font-secondary text-2xl font-bold text-secondary">{title}</h2>
        <p className="mt-2 text-secondary/70">{subtitle}</p>
        {hasGoogleLink && googleReviewsLabel && (
          <div className="mt-6">
            <GoogleReviewButton href={googleReviewsUrl!} label={googleReviewsLabel} />
          </div>
        )}
      </div>
      {reviews.length > 0 && <ReviewsCarousel reviews={reviews} />}
    </section>
  );
}
