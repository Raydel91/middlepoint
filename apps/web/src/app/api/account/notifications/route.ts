import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { getPayloadClient } from '@/lib/payload';
import { handleApiError, AppError } from '@/lib/logger';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'cliente') {
      throw new AppError('No autorizado', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: 'customer-notifications',
      where: { user: { equals: userId } },
      sort: '-createdAt',
      limit: 50,
      overrideAccess: true,
    });

    return NextResponse.json({ notifications: result.docs });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
