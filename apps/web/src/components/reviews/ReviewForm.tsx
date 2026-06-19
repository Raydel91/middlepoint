'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { useRouter } from '@/i18n/routing';
import { GoogleReviewButton } from './GoogleReviewButton';

type Props = {
  labels: {
    title: string;
    rating: string;
    comment: string;
    submit: string;
    success: string;
    pending: string;
    error: string;
    minLength: string;
    googleReview: string;
  };
  googleReviewsUrl?: string;
};

export function ReviewForm({ labels, googleReviewsUrl }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (comment.trim().length < 10) {
      setMessage({ type: 'error', text: labels.minLength });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || labels.error);
      }

      setComment('');
      setRating(5);
      setMessage({ type: 'success', text: `${labels.success} ${labels.pending}` });
      router.refresh();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : labels.error,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <h3 className="font-secondary text-lg font-semibold text-secondary">{labels.title}</h3>

      <div>
        <p className="mb-2 text-sm text-secondary/70">{labels.rating}</p>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const value = i + 1;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded p-1 transition hover:scale-110"
                aria-label={`${value} estrellas`}
              >
                <Star
                  size={24}
                  className={value <= rating ? 'fill-premium text-premium' : 'text-secondary/25'}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="review-comment" className="mb-2 block text-sm text-secondary/70">
          {labels.comment}
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="input-field resize-none"
          required
          minLength={10}
          maxLength={1000}
        />
      </div>

      {message && (
        <p
          className={`text-sm ${message.type === 'success' ? 'text-primary' : 'text-red-600'}`}
          role="status"
        >
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {googleReviewsUrl?.trim() ? (
          <GoogleReviewButton href={googleReviewsUrl} label={labels.googleReview} />
        ) : null}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? '...' : labels.submit}
        </button>
      </div>
    </form>
  );
}
