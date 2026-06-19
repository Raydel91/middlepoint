import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { getPayloadClient } from '@/lib/payload';
import { handleApiError, AppError } from '@/lib/logger';

const messageSchema = z.object({
  subject: z.string().min(3).max(120),
  message: z.string().min(10).max(2000),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'cliente') {
      throw new AppError('No autorizado', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'support-messages',
      where: { user: { equals: userId } },
      sort: '-createdAt',
      limit: 30,
      overrideAccess: true,
    });

    return NextResponse.json({ messages: result.docs });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'cliente') {
      throw new AppError('Debes iniciar sesión como cliente', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    if (!Number.isFinite(userId)) {
      throw new AppError('Sesión inválida', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    const payload = await getPayloadClient();
    const message = await payload.create({
      collection: 'support-messages',
      data: {
        user: userId,
        subject: parsed.data.subject,
        message: parsed.data.message,
        status: 'open',
        read_by_customer: true,
      },
      overrideAccess: true,
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
