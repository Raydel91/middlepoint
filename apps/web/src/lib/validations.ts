import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  email: z.string().email(),
  telefono: z.string().optional(),
  password: z.string().min(8),
});

export const addressSchema = z.object({
  street: z.string().min(3),
  city: z.string().min(2),
  province: z.string().min(2),
  postalCode: z.string().optional(),
  reference: z.string().optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional(),
});

export const deliveryProfileSchema = z.object({
  address: addressSchema,
  contactSecondary: contactSchema.optional(),
});

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.union([z.string(), z.number()]),
        quantity: z.number().int().min(1).max(99),
        price: z.number().positive(),
      }),
    )
    .min(1),
  paymentMethod: z.enum(['cash', 'transfer']),
  address: addressSchema,
  contactPrimary: contactSchema,
  contactSecondary: contactSchema.optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  currency: z.enum(['DOP', 'USD']).default('DOP'),
  csrfToken: z.string(),
});

export const trackingSchema = z.object({
  event: z.enum(['view_product', 'add_to_cart', 'checkout_start', 'purchase']),
  productId: z.union([z.string(), z.number()]).optional(),
  sessionId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const deliveryAssignSchema = z.object({
  orderId: z.union([z.string(), z.number()]),
  deliveryId: z.union([z.string(), z.number()]),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
