'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ReviewCard, type ReviewItem } from './ReviewCard';

type Props = {
  reviews: ReviewItem[];
};

export function ReviewsCarousel({ reviews }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [reviews.length, updateScrollState]);

  function scrollByPage(direction: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.9, 280) * direction;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  }

  if (reviews.length === 0) return null;

  return (
    <div className="relative">
      {reviews.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            disabled={!canScrollLeft}
            className="absolute -left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow-md transition hover:bg-background disabled:opacity-30 md:block"
            aria-label="Reseñas anteriores"
          >
            <ChevronLeft size={20} className="text-secondary" />
          </button>
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            disabled={!canScrollRight}
            className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white p-2 shadow-md transition hover:bg-background disabled:opacity-30 md:block"
            aria-label="Reseñas siguientes"
          >
            <ChevronRight size={20} className="text-secondary" />
          </button>
        </>
      )}

      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((review) => (
          <div
            key={review.id}
            className="w-[min(100%,320px)] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)]"
          >
            <ReviewCard review={review} />
          </div>
        ))}
      </div>
    </div>
  );
}
