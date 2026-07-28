import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import { handleApiError, AppError } from '@/lib/logger';
import { changePasswordSchema } from '@/lib/validations';
import { getCustomerSession } from '@/lib/account-auth';

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
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue?.message === 'password_mismatch') {
        throw new AppError('Las contraseñas no coinciden', 400, 'PASSWORD_MISMATCH');
      }
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    const payload = await getPayloadClient();
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      overrideAccess: true,
    });

    try {
      await payload.login({
        collection: 'users',
        data: {
          email: user.email,
          password: parsed.data.currentPassword,
        },
        overrideAccess: true,
      });
    } catch {
      throw new AppError('La contraseña actual es incorrecta', 400, 'INVALID_PASSWORD');
    }

    await payload.update({
      collection: 'users',
      id: userId,
      data: { password: parsed.data.newPassword },
      overrideAccess: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
