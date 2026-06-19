import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPayloadClient } from '@/lib/payload';
import { handleApiError, AppError } from '@/lib/logger';
import { reviewBodySchema } from '@/lib/review-validation';
import { getReviewOwnedByUser } from '@/lib/review-ownership';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AppError('Debes iniciar sesión', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    if (!Number.isFinite(userId)) {
      throw new AppError('Sesión inválida', 401, 'UNAUTHORIZED');
    }

    const { id } = await context.params;
    await getReviewOwnedByUser(id, userId);

    const body = await request.json();
    const parsed = reviewBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    const payload = await getPayloadClient();
    const review = await payload.update({
      collection: 'reviews',
      id,
      data: {
        rating: parsed.data.rating,
        comment: parsed.data.comment.trim(),
        approved: false,
      },
      overrideAccess: true,
    });

    return NextResponse.json({ review });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new AppError('Debes iniciar sesión', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    if (!Number.isFinite(userId)) {
      throw new AppError('Sesión inválida', 401, 'UNAUTHORIZED');
    }

    const { id } = await context.params;
    await getReviewOwnedByUser(id, userId);

    const payload = await getPayloadClient();
    await payload.delete({
      collection: 'reviews',
      id,
      overrideAccess: true,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
