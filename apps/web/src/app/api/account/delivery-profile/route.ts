import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPayloadClient } from '@/lib/payload';
import { handleApiError, AppError } from '@/lib/logger';
import { deliveryProfileSchema } from '@/lib/validations';
import { parseCheckoutProfilePayload } from '@/lib/user-delivery-profile';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'cliente') {
      throw new AppError('No autorizado', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    const payload = await getPayloadClient();
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      overrideAccess: true,
    });

    return NextResponse.json({
      address: user.delivery_address ?? {},
      contactSecondary: user.contact_secondary ?? {},
    });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'cliente') {
      throw new AppError('No autorizado', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    if (!Number.isFinite(userId)) {
      throw new AppError('Sesión inválida', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const parsed = deliveryProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    const payload = await getPayloadClient();
    const data = parseCheckoutProfilePayload(parsed.data);

    const user = await payload.update({
      collection: 'users',
      id: userId,
      data,
      overrideAccess: true,
    });

    return NextResponse.json({
      address: user.delivery_address,
      contactSecondary: user.contact_secondary,
    });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
