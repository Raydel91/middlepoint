import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import { handleApiError, AppError } from '@/lib/logger';
import { accountProfileSchema } from '@/lib/validations';
import { getCustomerSession } from '@/lib/account-auth';
import { parseUserAccountProfile } from '@/lib/user-delivery-profile';

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      throw new AppError('No autorizado', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    const payload = await getPayloadClient();
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      overrideAccess: true,
    });

    return NextResponse.json(parseUserAccountProfile(user));
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      throw new AppError('No autorizado', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    if (!Number.isFinite(userId)) {
      throw new AppError('Sesión inválida', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const parsed = accountProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    const email = parsed.data.email.toLowerCase().trim();
    const telefono = parsed.data.telefono?.trim() || undefined;

    const payload = await getPayloadClient();

    if (email !== session.user.email?.toLowerCase()) {
      const existing = await payload.find({
        collection: 'users',
        where: {
          and: [{ email: { equals: email } }, { id: { not_equals: userId } }],
        },
        limit: 1,
        overrideAccess: true,
      });
      if (existing.docs.length > 0) {
        throw new AppError('Este correo ya está registrado', 400, 'EMAIL_IN_USE');
      }
    }

    const user = await payload.update({
      collection: 'users',
      id: userId,
      data: {
        nombre: parsed.data.nombre.trim(),
        apellido: parsed.data.apellido.trim(),
        email,
        telefono,
      },
      overrideAccess: true,
    });

    return NextResponse.json(parseUserAccountProfile(user));
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
