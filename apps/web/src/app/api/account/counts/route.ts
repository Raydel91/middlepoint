import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/account-auth';
import { getPayloadClient } from '@/lib/payload';
import { handleApiError, AppError } from '@/lib/logger';

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) {
      throw new AppError('No autorizado', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    const payload = await getPayloadClient();

    const [unreadNotifications, unreadMessages] = await Promise.all([
      payload.count({
        collection: 'customer-notifications',
        where: {
          and: [{ user: { equals: userId } }, { read: { equals: false } }],
        },
        overrideAccess: true,
      }),
      payload.count({
        collection: 'support-messages',
        where: {
          and: [
            { user: { equals: userId } },
            { read_by_customer: { equals: false } },
            { admin_reply: { exists: true } },
          ],
        },
        overrideAccess: true,
      }),
    ]);

    return NextResponse.json({
      notifications: unreadNotifications.totalDocs,
      messages: unreadMessages.totalDocs,
    });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
