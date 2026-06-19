import type { PaymentMethod } from '@middlepoint/shared';

export interface PaymentProvider {
  method: PaymentMethod;
  processPayment(amount: number, currency: string, metadata: Record<string, unknown>): Promise<{ success: boolean; transactionId?: string }>;
}

export class CashPaymentProvider implements PaymentProvider {
  method: PaymentMethod = 'cash';

  async processPayment(amount: number, currency: string, _metadata: Record<string, unknown>) {
    return { success: true, transactionId: `CASH-${Date.now()}` };
  }
}

export class TransferPaymentProvider implements PaymentProvider {
  method: PaymentMethod = 'transfer';

  async processPayment(amount: number, currency: string, _metadata: Record<string, unknown>) {
    return { success: true, transactionId: `TRF-${Date.now()}` };
  }
}

export class StripePaymentProvider implements PaymentProvider {
  method: PaymentMethod = 'cash';

  async processPayment(
    _amount: number,
    _currency: string,
    _metadata: Record<string, unknown>,
  ): Promise<{ success: boolean; transactionId?: string }> {
    throw new Error('Stripe integration pending - configure STRIPE_SECRET_KEY');
  }
}

export class PayPalPaymentProvider implements PaymentProvider {
  method: PaymentMethod = 'cash';

  async processPayment(
    _amount: number,
    _currency: string,
    _metadata: Record<string, unknown>,
  ): Promise<{ success: boolean; transactionId?: string }> {
    throw new Error('PayPal integration pending - configure PAYPAL_CLIENT_ID');
  }
}

export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  switch (method) {
    case 'cash':
      return new CashPaymentProvider();
    case 'transfer':
      return new TransferPaymentProvider();
    default:
      return new CashPaymentProvider();
  }
}
