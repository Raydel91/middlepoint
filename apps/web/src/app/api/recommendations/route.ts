import { NextRequest, NextResponse } from 'next/server';
import { getServices } from '@/lib/payload';
import { auth } from '@/lib/auth/config';
import { handleApiError, AppError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = request.nextUrl.searchParams.get('userId') || session?.user?.id;

    if (!userId) {
      throw new AppError('Usuario requerido', 400, 'VALIDATION_ERROR');
    }

    const services = await getServices();
    const recommendations = await services.recommendation.getRecommendations(userId);

    return NextResponse.json(recommendations);
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
