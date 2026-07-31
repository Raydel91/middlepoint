import type { GroupField } from 'payload'
import { updateAllowMarketing } from './access'

/** Enlaces de redes para categoría/producto (no Twitter/X). */
export const socialGroup: GroupField = {
  name: 'social',
  type: 'group',
  label: 'Social Media',
  access: { update: updateAllowMarketing },
  admin: {
    description:
      'Enlaces de la marca o producto. Open Graph (título/imagen al compartir) está en la pestaña SEO.',
  },
  fields: [
    {
      name: 'instagram_url',
      type: 'text',
      label: 'Instagram URL',
      access: { update: updateAllowMarketing },
    },
    {
      name: 'facebook_url',
      type: 'text',
      label: 'Facebook URL',
      access: { update: updateAllowMarketing },
      admin: { description: 'Opcional' },
    },
    {
      name: 'whatsapp_url',
      type: 'text',
      label: 'WhatsApp URL',
      access: { update: updateAllowMarketing },
      admin: { description: 'Ej: https://wa.me/1829…' },
    },
    {
      name: 'tiktok_url',
      type: 'text',
      label: 'TikTok URL',
      access: { update: updateAllowMarketing },
      admin: { description: 'Opcional' },
    },
  ],
}
