import type { Payload, Where } from 'payload';
import type { OrderStatus } from '@middlepoint/shared';

const OLD_ORDER_DAYS = 30;

export async function deleteNotificationsForUser(
  payload: Payload,
  userId: number,
  whereExtra?: Where,
) {
  const and: Where[] = [{ user: { equals: userId } }];
  if (whereExtra) and.push(whereExtra);
  const result = await payload.find({
    collection: 'customer-notifications',
    where: { and },
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

  return result.docs.length;
}

export async function deleteNotificationsForOrders(
  payload: Payload,
  userId: number,
  orderIds: Array<string | number>,
) {
  if (orderIds.length === 0) return 0;

  const numericIds = orderIds.map((id) => Number(id)).filter(Number.isFinite);
  if (numericIds.length === 0) return 0;

  return deleteNotificationsForUser(payload, userId, {
    order: { in: numericIds },
  });
}

export async function getOrderIdsByStatus(
  payload: Payload,
  userId: number,
  statuses: OrderStatus[],
  olderThanDays?: number,
) {
  const and: Where[] = [
    { user: { equals: userId } },
    { status: { in: statuses } },
  ];

  if (olderThanDays != null) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);
    and.push({ createdAt: { less_than: cutoff.toISOString() } });
  }

  const result = await payload.find({
    collection: 'orders',
    where: { and },
    limit: 500,
    overrideAccess: true,
  });

  return result.docs.map((doc) => doc.id);
}

export async function deleteNotificationsForOrderFilter(
  payload: Payload,
  userId: number,
  filter: 'old' | 'cancelled' | 'returned',
) {
  let orderIds: Array<string | number> = [];

  if (filter === 'old') {
    orderIds = await getOrderIdsByStatus(payload, userId, ['delivered'], OLD_ORDER_DAYS);
  } else if (filter === 'cancelled') {
    orderIds = await getOrderIdsByStatus(payload, userId, ['cancelled']);
  } else if (filter === 'returned') {
    orderIds = await getOrderIdsByStatus(payload, userId, ['returned']);
  }

  return deleteNotificationsForOrders(payload, userId, orderIds);
}

export async function updateNotificationsForUser(
  payload: Payload,
  userId: number,
  read: boolean,
  ids?: Array<string | number>,
) {
  const and: Where[] = [{ user: { equals: userId } }];
  if (ids?.length) {
    and.push({ id: { in: ids.map((id) => Number(id)) } });
  }

  const result = await payload.find({
    collection: 'customer-notifications',
    where: { and },
    limit: 500,
    overrideAccess: true,
  });

  await Promise.all(
    result.docs.map((doc) =>
      payload.update({
        collection: 'customer-notifications',
        id: doc.id,
        data: { read },
        overrideAccess: true,
      }),
    ),
  );

  return result.docs.length;
}
