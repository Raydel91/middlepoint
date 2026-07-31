import type { Field, GroupField } from 'payload'
import { updateAllowMarketing, updateUnlessMarketing } from './access'

const i18nText = (name: string, label: string, description?: string): Field => ({
  name,
  type: 'group',
  label,
  access: { update: updateAllowMarketing },
  admin: description ? { description } : undefined,
  fields: [
    { name: 'es', type: 'text', label: 'ES', access: { update: updateAllowMarketing } },
    { name: 'en', type: 'text', label: 'EN', access: { update: updateAllowMarketing } },
  ],
})

const i18nTextarea = (name: string, label: string, description?: string): Field => ({
  name,
  type: 'group',
  label,
  access: { update: updateAllowMarketing },
  admin: description ? { description } : undefined,
  fields: [
    {
      name: 'es',
      type: 'textarea',
      label: 'ES',
      access: { update: updateAllowMarketing },
      admin: { rows: 3 },
    },
    {
      name: 'en',
      type: 'textarea',
      label: 'EN',
      access: { update: updateAllowMarketing },
      admin: { rows: 3 },
    },
  ],
})

/**
 * Grupo SEO (sin Twitter).
 * El slug va en la pestaña SEO como campo hermano (colección).
 * JSON-LD se genera en la tienda; no es editable.
 */
export const seoGroup: GroupField = {
  name: 'seo',
  type: 'group',
  label: 'Metadatos',
  access: { update: updateAllowMarketing },
  admin: {
    description:
      'Si dejas un campo vacío, se usan el nombre y la descripción del registro. Ideal Meta Title 50–60 y Meta Description 140–160 caracteres.',
  },
  fields: [
    i18nText(
      'meta_title',
      'Meta Title',
      'Ej: Green Detox | Jugo Natural | Vita Green | MiddlePoint · 50–60 caracteres',
    ),
    i18nTextarea(
      'meta_description',
      'Meta Description',
      'Ej: Refrescante jugo natural… · 140–160 caracteres',
    ),
    i18nText(
      'keywords',
      'Keywords',
      'Para organización interna (Google ya no las usa para ranking). Ej: green detox, jugo natural',
    ),
    i18nText('og_title', 'Open Graph Title', 'Título al compartir en WhatsApp, Instagram, Facebook, etc.'),
    i18nTextarea(
      'og_description',
      'Open Graph Description',
      'Texto de la vista previa al compartir el enlace',
    ),
    {
      name: 'og_image',
      type: 'upload',
      relationTo: 'media',
      label: 'Open Graph Image',
      access: { update: updateAllowMarketing },
      admin: {
        description: 'Recomendado 1200 × 630 px para WhatsApp / redes.',
      },
    },
    {
      name: 'robots',
      type: 'select',
      label: 'Robots',
      defaultValue: 'index',
      access: { update: updateAllowMarketing },
      options: [
        { label: 'Index', value: 'index' },
        { label: 'No Index', value: 'noindex' },
      ],
      admin: {
        description: 'Index = aparece en Google. No Index = no indexar esta página.',
      },
    },
  ],
}

/** Campos UI de la pestaña SEO (preview + nota JSON-LD). */
export function seoTabUiFields(pathKind: 'product' | 'category'): Field[] {
  return [
    {
      name: 'seo_google_preview',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/payload/SeoGooglePreview#SeoGooglePreview',
        },
        custom: { pathKind },
      },
    },
    {
      name: 'seo_structured_data_note',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/payload/SeoStructuredDataNote#SeoStructuredDataNote',
        },
      },
    },
  ]
}

export { updateUnlessMarketing, updateAllowMarketing }
