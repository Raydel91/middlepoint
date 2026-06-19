import { NextRequest, NextResponse } from 'next/server';
import { getServices, getPayloadClient } from '@/lib/payload';
import { auth } from '@/lib/auth/config';
import { checkoutSchema } from '@/lib/validations';
import { validateCsrfToken } from '@/lib/csrf';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { handleApiError, AppError } from '@/lib/logger';
import {
  sendOrderConfirmationEmail,
  sendWhatsAppNotification,
  buildOrderWhatsAppMessage,
} from '@/lib/notifications';
import { getI18nValue } from '@middlepoint/shared';
import { getPaymentProvider } from '@/lib/payments';
import { parseCheckoutProfilePayload } from '@/lib/user-delivery-profile';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = rateLimit(`checkout:${ip}`, RATE_LIMITS.checkout.limit, RATE_LIMITS.checkout.windowMs);
    if (!rl.success) {
      throw new AppError('Demasiadas solicitudes', 429, 'RATE_LIMIT');
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError('Datos inválidos', 400, 'VALIDATION_ERROR');
    }

    const data = parsed.data;
    const csrfValid = await validateCsrfToken(data.csrfToken);
    if (!csrfValid) {
      throw new AppError('Token CSRF inválido', 403, 'CSRF_ERROR');
    }

    const session = await auth();
    const services = await getServices();
    const payload = await getPayloadClient();
    const settings = await payload.findGlobal({ slug: 'settings' });

    const total = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const paymentProvider = getPaymentProvider(data.paymentMethod);
    await paymentProvider.processPayment(total, data.currency, { orderItems: data.items.length });

    const order = await services.order.createOrder({
      userId: session?.user?.id ? Number(session.user.id) : undefined,
      items: data.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
      })),
      total,
      paymentMethod: data.paymentMethod,
      address: data.address,
      contactPrimary: data.contactPrimary,
      contactSecondary: data.contactSecondary,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      currency: data.currency,
      exchangeRate: settings.exchange_rate_usd,
    });

    if (session?.user?.id) {
      const userId = Number(session.user.id);
      if (Number.isFinite(userId)) {
        await payload.update({
          collection: 'users',
          id: userId,
          data: {
            telefono: data.contactPrimary.phone,
            ...parseCheckoutProfilePayload({
              address: data.address,
              contactSecondary: data.contactSecondary,
            }),
          },
          overrideAccess: true,
        });
      }
    }

    await services.analytics.trackEvent({
      event: 'purchase',
      userId: session?.user?.id,
      metadata: { orderId: order.id, total },
    });

    const itemsWithNames = await Promise.all(
      data.items.map(async (item) => {
        const product = await payload.findByID({
          collection: 'products',
          id: item.productId,
        });
        return {
          name: getI18nValue(product.nombre, 'es'),
          quantity: item.quantity,
          price: item.price,
        };
      }),
    );

    const emailData = {
      orderId: order.id,
      total,
      currency: data.currency,
      customerName: data.contactPrimary.name,
      customerEmail: data.contactPrimary.email || session?.user?.email || '',
      items: itemsWithNames,
    };

    await sendOrderConfirmationEmail(emailData);

    if (data.contactPrimary.phone) {
      await sendWhatsAppNotification(
        data.contactPrimary.phone,
        buildOrderWhatsAppMessage(emailData),
      );
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
