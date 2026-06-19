import type { Media } from '@/payload-types';
import { getMediaUrl } from '@/lib/media';
import type { ReviewItem } from '@/components/reviews/ReviewCard';

type ReviewDoc = {
  id: string | number;
  author_name: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: number | { avatar?: number | Media | null } | null;
};

export function mapReviewForDisplay(doc: ReviewDoc): ReviewItem {
  const user = doc.user;
  const avatar =
    user && typeof user === 'object' ? user.avatar : undefined;

  return {
    id: doc.id,
    author_name: doc.author_name,
    rating: doc.rating,
    comment: doc.comment,
    createdAt: doc.createdAt,
    avatarUrl: getMediaUrl(avatar as number | Media | null | undefined),
  };
}
