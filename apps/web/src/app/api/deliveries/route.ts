import { NextRequest, NextResponse } from 'next/server';
import { getServices } from '@/lib/payload';
import { auth } from '@/lib/auth/config';
import { deliveryAssignSchema } from '@/lib/validations';
import { handleApiError, AppError } from '@/lib/logger';
import { isStaffRole } from '@middlepoint/shared';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !isStaffRole(session.user.role)) {
      throw new AppError('No autorizado', 403, 'FORBIDDEN');
    }

    const services = await getServices();
    const deliveries = await services.delivery.getAvailable();

    return NextResponse.json(deliveries);
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || !isStaffRole(session.user.role)) {
      throw new AppError('No autorizado', 403, 'FORBIDDEN');
    }

    const body = await request.json();
    const parsed = deliveryAssignSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    const services = await getServices();
    const delivery = await services.delivery.assignDelivery(
      parsed.data.orderId,
      parsed.data.deliveryId,
    );

    return NextResponse.json({ success: true, delivery });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
