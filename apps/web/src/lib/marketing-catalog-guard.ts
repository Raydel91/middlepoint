import type { PayloadRequest } from 'payload'
import { isMarketingRole } from '@middlepoint/shared'

const PRODUCT_MARKETING_KEYS = new Set([
  'descripcion',
  'seo',
  'galeria',
  'imagen',
  'social',
])

const CATEGORY_MARKETING_KEYS = new Set([
  'descripcion',
  'seo',
  'imagen',
  'social',
  'instagram_url',
])

/**
 * Marketing solo puede persistir descripción, SEO, galería/fotos y social.
 * El resto se conserva del documento original.
 */
export function restrictMarketingCatalogUpdate<T extends Record<string, unknown>>(args: {
  data: T
  originalDoc?: Record<string, unknown> | null
  req: PayloadRequest
  kind: 'product' | 'category'
}): T {
  const role = args.req.user?.role as import('@middlepoint/shared').UserRole | undefined
  if (!isMarketingRole(role) || !args.originalDoc) return args.data

  const allowed = args.kind === 'product' ? PRODUCT_MARKETING_KEYS : CATEGORY_MARKETING_KEYS
  const next = { ...args.originalDoc } as Record<string, unknown>

  for (const key of allowed) {
    if (key in args.data) next[key] = args.data[key]
  }

  // Payload siempre envía id / timestamps en updates
  if ('id' in args.data) next.id = args.data.id
  if ('updatedAt' in args.data) next.updatedAt = args.data.updatedAt

  return next as T
}
