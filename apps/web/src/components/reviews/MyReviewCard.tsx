'use client';

import { useState } from 'react';
import { Pencil, Star, Trash2 } from 'lucide-react';
import { useRouter } from '@/i18n/routing';

type Review = {
  id: string | number;
  author_name: string;
  rating: number;
  comment: string;
  createdAt: string;
  approved?: boolean | null;
};

type Labels = {
  rating: string;
  comment: string;
  edit: string;
  save: string;
  cancel: string;
  delete: string;
  deleteConfirm: string;
  awaitingApproval: string;
  updateSuccess: string;
  updatePending: string;
  deleteSuccess: string;
  error: string;
  minLength: string;
};

type Props = {
  review: Review;
  labels: Labels;
};

export function MyReviewCard({ review, labels }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  const date = new Date(review.createdAt).toLocaleDateString('es-DO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  function resetForm() {
    setRating(review.rating);
    setComment(review.comment);
    setEditing(false);
    setMessage(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (comment.trim().length < 10) {
      setMessage({ type: 'error', text: labels.minLength });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || labels.error);
      }

      setEditing(false);
      setMessage({ type: 'success', text: `${labels.updateSuccess} ${labels.updatePending}` });
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

  async function handleDelete() {
    if (!window.confirm(labels.deleteConfirm)) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/reviews/${review.id}`, { method: 'DELETE' });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || labels.error);
      }

      router.refresh();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : labels.error,
      });
      setLoading(false);
    }
  }

  return (
    <article className="card p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-secondary">{review.author_name}</p>
          <p className="text-xs text-secondary/50">{date}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!review.approved && (
            <span className="rounded-full bg-premium/20 px-2 py-0.5 text-xs font-medium text-secondary">
              {labels.awaitingApproval}
            </span>
          )}
          {!editing && (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                disabled={loading}
                className="rounded-lg p-2 text-secondary/70 transition hover:bg-primary/10 hover:text-primary"
                aria-label={labels.edit}
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="rounded-lg p-2 text-secondary/70 transition hover:bg-red-50 hover:text-red-600"
                aria-label={labels.delete}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="space-y-4">
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
                      size={22}
                      className={value <= rating ? 'fill-premium text-premium' : 'text-secondary/25'}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor={`review-comment-${review.id}`} className="mb-2 block text-sm text-secondary/70">
              {labels.comment}
            </label>
            <textarea
              id={`review-comment-${review.id}`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="input-field resize-none"
              required
              minLength={10}
              maxLength={1000}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '...' : labels.save}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="rounded-xl border border-primary/20 px-4 py-2 text-sm font-medium text-secondary transition hover:bg-primary/5"
            >
              {labels.cancel}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={16}
                className={i < review.rating ? 'fill-premium text-premium' : 'text-secondary/20'}
              />
            ))}
          </div>
          <p className="text-sm leading-relaxed text-secondary/80">&ldquo;{review.comment}&rdquo;</p>
        </>
      )}

      {message && (
        <p
          className={`mt-4 text-sm ${message.type === 'success' ? 'text-primary' : 'text-red-600'}`}
          role="status"
        >
          {message.text}
        </p>
      )}
    </article>
  );
}
