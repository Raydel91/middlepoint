import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import { auth } from '@/lib/auth/config';
import { handleApiError, AppError } from '@/lib/logger';
import { reviewBodySchema } from '@/lib/review-validation';

const reviewSchema = reviewBodySchema;

export async function GET() {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'reviews',
      where: { approved: { equals: true } },
      sort: '-createdAt',
      limit: 12,
    });

    return NextResponse.json({ reviews: result.docs });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AppError('Debes iniciar sesión', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    const payload = await getPayloadClient();
    const userId = Number(session.user.id);
    if (!Number.isFinite(userId)) {
      throw new AppError('Sesión inválida', 401, 'UNAUTHORIZED');
    }

    const review = await payload.create({
      collection: 'reviews',
      data: {
        user: userId,
        author_name:
          `${session.user.nombre ?? ''} ${session.user.apellido ?? ''}`.trim() ||
          session.user.email ||
          '',
        rating: parsed.data.rating,
        comment: parsed.data.comment,
        approved: false,
      },
      overrideAccess: true,
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
