import { z } from 'zod';

export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** Internacional (E.164): 7–15 dígitos; acepta +, espacios y guiones */
export const phoneSchema = z.string().refine(
  (val) => {
    const digits = normalizePhoneDigits(val);
    return digits.length >= 7 && digits.length <= 15;
  },
  { message: 'invalid_phone' },
);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  email: z.string().email(),
  telefono: z
    .string()
    .optional()
    .refine((val) => !val?.trim() || phoneSchema.safeParse(val.trim()).success, {
      message: 'invalid_phone',
    }),
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
  phone: phoneSchema,
  email: z.union([z.string().email(), z.literal('')]).optional(),
});

export const deliveryProfileSchema = z.object({
  address: addressSchema,
  contactSecondary: contactSchema.optional(),
});

/** Valida un string YYYY-MM-DD como fecha de calendario real y plausible. */
function isValidScheduleDate(val: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return false;
  const [y, m, d] = val.split('-').map(Number);
  if (y < 2020 || y > 2100) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Valida un string HH:MM en formato 24h. */
function isValidScheduleTime(val: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(val);
}

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
  paymentAccountIndex: z.number().int().min(0).max(50).optional(),
  address: addressSchema,
  contactPrimary: contactSchema,
  contactSecondary: contactSchema.optional(),
  scheduledDate: z
    .string({ required_error: 'invalid_schedule' })
    .transform((val) => val.trim())
    .refine((val) => isValidScheduleDate(val), { message: 'invalid_schedule' }),
  scheduledTime: z
    .string({ required_error: 'invalid_schedule' })
    .transform((val) => val.trim())
    .refine((val) => isValidScheduleTime(val), { message: 'invalid_schedule' }),
  currency: z.enum(['DOP', 'USD']).default('DOP'),
  locale: z.enum(['es', 'en']).optional(),
  csrfToken: z.string(),
});

export const trackingSchema = z.object({
  event: z.enum(['view_product', 'add_to_cart', 'checkout_start', 'purchase']),
  productId: z.union([z.string(), z.number()]).optional(),
  sessionId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

/** deliveryId = id del usuario repartidor (roles delivery / operador / super_admin). */
export const deliveryAssignSchema = z.object({
  orderId: z.union([z.string(), z.number()]),
  deliveryId: z.union([z.string(), z.number()]),
});

export const accountProfileSchema = z.object({
  nombre: z.string().min(2),
  apellido: z.string().min(2),
  email: z.string().email(),
  telefono: z
    .string()
    .optional()
    .refine((val) => !val?.trim() || phoneSchema.safeParse(val.trim()).success, {
      message: 'invalid_phone',
    }),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'password_mismatch',
    path: ['confirmPassword'],
  });

export const adminOrderActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('advance') }),
  z.object({ action: z.literal('return') }),
  z.object({
    action: z.literal('cancel'),
    reason: z.string().min(3).max(1000),
    sendMessage: z.boolean().optional().default(false),
  }),
  z.object({ action: z.literal('revert') }),
  z.object({
    action: z.literal('reschedule'),
    scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
  }),
  z.object({
    action: z.literal('assignDelivery'),
    deliveryUserId: z.union([z.number().int().positive(), z.null()]),
  }),
]);

export const accountOrderScheduleSchema = z.object({
  scheduledDate: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => isValidScheduleDate(val), { message: 'invalid_schedule' }),
  scheduledTime: z
    .string()
    .transform((val) => val.trim())
    .refine((val) => isValidScheduleTime(val), { message: 'invalid_schedule' }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
