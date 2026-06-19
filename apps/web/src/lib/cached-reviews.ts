import { cache } from 'react';
import { getPayloadClient } from '@/lib/payload';

export const getApprovedReviews = cache(async () => {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'reviews',
    where: { approved: { equals: true } },
    sort: '-createdAt',
    limit: 10,
    depth: 2,
  });
  return result.docs;
});
