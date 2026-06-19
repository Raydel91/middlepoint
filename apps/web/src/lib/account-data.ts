import type { OrderStatus } from '@middlepoint/shared';
import type { Payload } from 'payload';

async function safeFind<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function fetchAccountReviews(payload: Payload, userId: number) {
  return safeFind(async () => {
    const result = await payload.find({
      collection: 'reviews',
      where: { user: { equals: userId } },
      sort: '-createdAt',
      limit: 20,
      overrideAccess: true,
    });
    return result.docs;
  }, []);
}

export async function fetchAccountOrders(
  payload: Payload,
  userId: number,
  email?: string | null,
) {
  return safeFind(async () => {
    const result = await payload.find({
      collection: 'orders',
      where: { user: { equals: userId } },
      sort: '-createdAt',
      limit: 30,
      overrideAccess: true,
    });

    if (result.docs.length > 0) {
      return result.docs as Array<{
        id: string | number;
        total: number;
        status: OrderStatus;
        payment_method: string;
        currency?: string | null;
        createdAt: string;
      }>;
    }

    if (!email) return [];

    const orphan = await payload.find({
      collection: 'orders',
      where: {
        and: [
          { user: { exists: false } },
          { 'contact_primary.email': { equals: email.toLowerCase() } },
        ],
      },
      sort: '-createdAt',
      limit: 30,
      overrideAccess: true,
    });

    for (const order of orphan.docs) {
      await payload.update({
        collection: 'orders',
        id: order.id,
        data: { user: userId },
        overrideAccess: true,
      });
    }

    return orphan.docs as typeof result.docs;
  }, []);
}

export async function fetchAccountNotifications(payload: Payload, userId: number) {
  return safeFind(async () => {
    const result = await payload.find({
      collection: 'customer-notifications',
      where: { user: { equals: userId } },
      sort: '-createdAt',
      limit: 50,
      overrideAccess: true,
    });
    return result.docs;
  }, []);
}

export async function fetchAccountSupportMessages(payload: Payload, userId: number) {
  return safeFind(async () => {
    const result = await payload.find({
      collection: 'support-messages',
      where: { user: { equals: userId } },
      sort: '-createdAt',
      limit: 30,
      overrideAccess: true,
    });
    return result.docs;
  }, []);
}
