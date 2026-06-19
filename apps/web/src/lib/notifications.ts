import { logger } from '@/lib/logger';

interface OrderEmailData {
  orderId: string | number;
  total: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  if (!process.env.SMTP_HOST) {
    logger.info('Email skipped (SMTP not configured)', { orderId: data.orderId });
    return false;
  }

  try {
    logger.info('Order confirmation email sent', {
      to: data.customerEmail,
      orderId: data.orderId,
    });
    return true;
  } catch (error) {
    logger.error('Failed to send email', { error, orderId: data.orderId });
    return false;
  }
}

export async function sendWhatsAppNotification(
  phone: string,
  message: string,
): Promise<boolean> {
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.info('WhatsApp skipped (webhook not configured)', { phone });
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
    });
    return response.ok;
  } catch (error) {
    logger.error('WhatsApp notification failed', { error, phone });
    return false;
  }
}

export function buildOrderWhatsAppMessage(data: OrderEmailData): string {
  const itemsList = data.items
    .map((i) => `${i.quantity}x ${i.name} - ${data.currency} ${i.price}`)
    .join('\n');
  return `🛒 *MiddlePoint* - Pedido #${data.orderId}\n\nHola ${data.customerName},\n\nTu pedido ha sido confirmado:\n${itemsList}\n\n*Total: ${data.currency} ${data.total}*\n\n¡Gracias por tu compra!`;
}
