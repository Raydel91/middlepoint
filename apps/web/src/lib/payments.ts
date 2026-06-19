import type { PaymentMethod } from '@middlepoint/shared';

export interface PaymentProvider {
  processPayment(
    amount: number,
    currency: string,
    metadata?: Record<string, unknown>,
  ): Promise<{ success: boolean }>;
}

class ManualPaymentProvider implements PaymentProvider {
  async processPayment() {
    return { success: true };
  }
}

const providers: Record<PaymentMethod, PaymentProvider> = {
  cash: new ManualPaymentProvider(),
  transfer: new ManualPaymentProvider(),
};

export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  return providers[method];
}
