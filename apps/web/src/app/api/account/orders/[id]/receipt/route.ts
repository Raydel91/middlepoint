import { NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/account-auth';
import { getPayloadClient } from '@/lib/payload';
import { handleApiError, AppError } from '@/lib/logger';
import { buildOrderReceiptDataFromOrder } from '@/lib/order-receipt-data';
import type { Locale } from '@middlepoint/shared';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      throw new AppError('No autorizado', 401, 'UNAUTHORIZED');
    }

    const userId = Number(session.user.id);
    const { id } = await context.params;
    const url = new URL(request.url);
    const localeParam = url.searchParams.get('locale');
    const fallbackLocale: Locale = localeParam === 'en' ? 'en' : 'es';

    const payload = await getPayloadClient();
    const order = await payload.findByID({
      collection: 'orders',
      id,
      overrideAccess: true,
    });

    const ownerId =
      typeof order.user === 'object' && order.user !== null
        ? Number((order.user as { id: number }).id)
        : Number(order.user);

    const emailMatch =
      typeof (order.contact_primary as { email?: string } | undefined)?.email === 'string' &&
      session.user.email &&
      (order.contact_primary as { email?: string }).email!.toLowerCase() ===
        session.user.email.toLowerCase();

    if (ownerId !== userId && !emailMatch) {
      throw new AppError('No autorizado', 403, 'FORBIDDEN');
    }

    if (order.status === 'cancelled') {
      throw new AppError('El pedido está cancelado', 409, 'ORDER_CANCELLED');
    }

    const receipt = await buildOrderReceiptDataFromOrder(payload, order, fallbackLocale);

    return NextResponse.json({ receipt });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
