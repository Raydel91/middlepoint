import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';
import { registerSchema } from '@/lib/validations';
import { handleApiError, AppError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    const { nombre, apellido, email, telefono, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const payload = await getPayloadClient();

    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: normalizedEmail } },
      limit: 1,
    });

    if (existing.docs.length > 0) {
      throw new AppError('El email ya está registrado', 409, 'EMAIL_EXISTS');
    }

    const user = await payload.create({
      collection: 'users',
      data: {
        nombre,
        apellido,
        email: normalizedEmail,
        telefono,
        password,
        role: 'cliente',
      },
      overrideAccess: true,
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, nombre: user.nombre },
    });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
