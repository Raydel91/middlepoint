import { NextRequest, NextResponse } from 'next/server';
import { getServices, getPayloadClient } from '@/lib/payload';
import { auth } from '@/lib/auth/config';
import { checkoutSchema } from '@/lib/validations';
import { validateCsrfToken } from '@/lib/csrf';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { handleApiError, AppError, logger } from '@/lib/logger';
import {
  sendOrderConfirmationEmail,
  sendWhatsAppNotification,
  buildOrderWhatsAppMessage,
} from '@/lib/notifications';
import { getI18nValue } from '@middlepoint/shared';
import { getPaymentProvider } from '@/lib/payments';
import { parseCheckoutProfilePayload } from '@/lib/user-delivery-profile';
import { getStoreContent } from '@/lib/store-content';

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

    let paymentAccount: Record<string, unknown> | undefined;
    if (data.paymentMethod === 'transfer') {
      const content = await getStoreContent(data.locale || 'es');
      const usableAccounts = content.payment.accounts.filter((a) => a.accountNumber?.trim());
      if (usableAccounts.length > 0) {
        const index = Math.min(Math.max(data.paymentAccountIndex ?? 0, 0), usableAccounts.length - 1);
        paymentAccount = { ...usableAccounts[index] };
      }
    }

    const order = await services.order.createOrder({
      userId: session?.user?.id ? Number(session.user.id) : undefined,
      items: data.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
      })),
      total,
      paymentMethod: data.paymentMethod,
      paymentAccount,
      address: data.address,
      contactPrimary: data.contactPrimary,
      contactSecondary: data.contactSecondary,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      currency: data.currency,
      exchangeRate: settings.exchange_rate_usd,
      locale: data.locale,
    });

    if (session?.user?.id) {
      const userId = Number(session.user.id);
      if (Number.isFinite(userId)) {
        try {
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
        } catch (profileErr) {
          logger.warn('Could not sync checkout profile to user', {
            userId,
            error: profileErr instanceof Error ? profileErr.message : String(profileErr),
          });
        }
      }
    }

    try {
      await services.analytics.trackEvent({
        event: 'purchase',
        userId: session?.user?.id,
        metadata: { orderId: order.id, total },
      });
    } catch {
      /* non-blocking */
    }

    try {
      const itemsWithNames = await Promise.all(
        data.items.map(async (item) => {
          const product = await payload.findByID({
            collection: 'products',
            id: item.productId,
            overrideAccess: true,
          });
          return {
            name: getI18nValue(product.nombre, data.locale || 'es'),
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
    } catch (notifyErr) {
      logger.warn('Post-checkout notifications failed', {
        orderId: order.id,
        error: notifyErr instanceof Error ? notifyErr.message : String(notifyErr),
      });
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    const { message, status, code } = handleApiError(error);
    return NextResponse.json({ error: message, code }, { status });
  }
}
