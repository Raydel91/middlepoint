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
      'Enlaces públicos de la marca o ficha. El título/imagen al compartir (Open Graph) está en la pestaña SEO.',
  },
  fields: [
    {
      name: 'instagram_url',
      type: 'text',
      label: 'Instagram URL',
      access: { update: updateAllowMarketing },
      admin: {
        description: [
          'Qué es: perfil o publicación de Instagram asociada a esta ficha.',
          'Ejemplo: https://instagram.com/tupuntomedio.vitagreen',
        ].join(' '),
      },
    },
    {
      name: 'facebook_url',
      type: 'text',
      label: 'Facebook URL',
      access: { update: updateAllowMarketing },
      admin: {
        description: [
          'Qué es: página o publicación de Facebook (opcional).',
          'Ejemplo: https://facebook.com/tupuntomedio',
        ].join(' '),
      },
    },
    {
      name: 'whatsapp_url',
      type: 'text',
      label: 'WhatsApp URL',
      access: { update: updateAllowMarketing },
      admin: {
        description: [
          'Qué es: enlace directo de chat de WhatsApp.',
          'Ejemplo: https://wa.me/18299876543',
        ].join(' '),
      },
    },
    {
      name: 'tiktok_url',
      type: 'text',
      label: 'TikTok URL',
      access: { update: updateAllowMarketing },
      admin: {
        description: [
          'Qué es: perfil de TikTok (opcional).',
          'Ejemplo: https://tiktok.com/@tupuntomedio',
        ].join(' '),
      },
    },
  ],
}
