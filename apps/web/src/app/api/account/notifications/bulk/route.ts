import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCustomerSession } from '@/lib/account-auth';
import { getPayloadClient } from '@/lib/payload';
import { handleApiError, AppError } from '@/lib/logger';
import {
  deleteNotificationsForOrderFilter,
  deleteNotificationsForOrders,
  deleteNotificationsForUser,
  updateNotificationsForUser,
} from '@/lib/account-bulk';

const bulkSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('markRead'), ids: z.array(z.union([z.string(), z.number()])).optional() }),
  z.object({ action: z.literal('markUnread'), ids: z.array(z.union([z.string(), z.number()])).optional() }),
  z.object({ action: z.literal('delete'), ids: z.array(z.union([z.string(), z.number()])).optional() }),
  z.object({ action: z.literal('deleteAll') }),
  z.object({
    action: z.literal('deleteForOrders'),
    orderIds: z.array(z.union([z.string(), z.number()])),
  }),
  z.object({
    action: z.literal('deleteForOrderFilter'),
    filter: z.enum(['old', 'cancelled', 'returned']),
  }),
  z.object({ action: z.literal('deleteAllOrderNotifications') }),
]);

export async function POST(request: Request) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      throw new AppError('No autorizado', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    const body = await request.json();
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    const payload = await getPayloadClient();
    let affected = 0;

    switch (parsed.data.action) {
      case 'markRead':
        affected = await updateNotificationsForUser(payload, userId, true, parsed.data.ids);
        break;
      case 'markUnread':
        affected = await updateNotificationsForUser(payload, userId, false, parsed.data.ids);
        break;
      case 'delete':
        if (parsed.data.ids?.length) {
          const ids = parsed.data.ids.map((id) => Number(id));
          const result = await payload.find({
            collection: 'customer-notifications',
            where: {
              and: [{ user: { equals: userId } }, { id: { in: ids } }],
            },
            limit: 500,
            overrideAccess: true,
          });
          await Promise.all(
            result.docs.map((doc) =>
              payload.delete({
                collection: 'customer-notifications',
                id: doc.id,
                overrideAccess: true,
              }),
            ),
          );
          affected = result.docs.length;
        }
        break;
      case 'deleteAll':
        affected = await deleteNotificationsForUser(payload, userId);
        break;
      case 'deleteForOrders':
        affected = await deleteNotificationsForOrders(payload, userId, parsed.data.orderIds);
        break;
      case 'deleteForOrderFilter':
        affected = await deleteNotificationsForOrderFilter(
          payload,
          userId,
          parsed.data.filter,
        );
        break;
      case 'deleteAllOrderNotifications':
        affected = await deleteNotificationsForUser(payload, userId, {
          type: { equals: 'order_status' },
        });
        break;
    }

    return NextResponse.json({ success: true, affected });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
