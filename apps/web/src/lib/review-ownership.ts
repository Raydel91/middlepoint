import { getPayloadClient } from '@/lib/payload';
import { AppError } from '@/lib/logger';

export async function getReviewOwnedByUser(reviewId: string, userId: number) {
  const payload = await getPayloadClient();
  let review;

  try {
    review = await payload.findByID({
      collection: 'reviews',
      id: reviewId,
      overrideAccess: true,
    });
  } catch {
    throw new AppError('Reseña no encontrada', 404, 'NOT_FOUND');
  }

  const ownerId =
    typeof review.user === 'object' && review.user !== null
      ? Number(review.user.id)
      : Number(review.user);

  if (!Number.isFinite(ownerId) || ownerId !== userId) {
    throw new AppError('No autorizado', 403, 'FORBIDDEN');
  }

  return review;
}
