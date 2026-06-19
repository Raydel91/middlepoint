import { NextRequest, NextResponse } from 'next/server';
import { getServices } from '@/lib/payload';
import { auth } from '@/lib/auth/config';
import { trackingSchema } from '@/lib/validations';
import { handleApiError, AppError } from '@/lib/logger';
import { generateSessionId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = trackingSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    const session = await auth();
    const services = await getServices();
    const sessionId = parsed.data.sessionId || generateSessionId();

    await services.analytics.trackEvent({
      event: parsed.data.event,
      userId: session?.user?.id,
      productId: parsed.data.productId,
      sessionId,
      metadata: parsed.data.metadata,
    });

    if (parsed.data.event === 'view_product' && parsed.data.productId) {
      await services.product.incrementViewCount(parsed.data.productId);
    }

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
