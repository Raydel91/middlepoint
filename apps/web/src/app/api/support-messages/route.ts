import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPayloadClient } from '@/lib/payload';
import { handleApiError, AppError } from '@/lib/logger';
import { sendCustomerSupportMessage } from '@/lib/support-chat-service';
import { getCustomerSession } from '@/lib/account-auth';

const sendSchema = z.object({
  message: z.string().min(2).max(2000),
});

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      throw new AppError('No autorizado', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'support-messages',
      where: { user: { equals: userId } },
      sort: '-updatedAt',
      limit: 10,
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
    const session = await getCustomerSession();
    if (!session) {
      throw new AppError('Debes iniciar sesión', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    if (!Number.isFinite(userId)) {
      throw new AppError('Sesión inválida', 401, 'UNAUTHORIZED');
    }

    const body = await request.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    const payload = await getPayloadClient();
    const message = await sendCustomerSupportMessage(payload, userId, parsed.data.message);

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
