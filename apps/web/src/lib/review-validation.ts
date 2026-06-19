import { z } from 'zod';

export const reviewBodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(1000),
});
