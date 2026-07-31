import type { Field, GroupField, TextField } from 'payload'
import { updateAllowMarketing, updateUnlessMarketing } from './access'

const i18nText = (name: string, label: string, description: string): Field => ({
  name,
  type: 'group',
  label,
  access: { update: updateAllowMarketing },
  admin: { description },
  fields: [
    {
      name: 'es',
      type: 'text',
      label: 'ES',
      access: { update: updateAllowMarketing },
      admin: { description: 'Versión en español' },
    },
    {
      name: 'en',
      type: 'text',
      label: 'EN',
      access: { update: updateAllowMarketing },
      admin: { description: 'English version' },
    },
  ],
})

const i18nTextarea = (name: string, label: string, description: string): Field => ({
  name,
  type: 'group',
  label,
  access: { update: updateAllowMarketing },
  admin: { description },
  fields: [
    {
      name: 'es',
      type: 'textarea',
      label: 'ES',
      access: { update: updateAllowMarketing },
      admin: { rows: 3, description: 'Versión en español' },
    },
    {
      name: 'en',
      type: 'textarea',
      label: 'EN',
      access: { update: updateAllowMarketing },
      admin: { rows: 3, description: 'English version' },
    },
  ],
})

/** Slug en la pestaña SEO, con explicación y ejemplo de URL final. */
export function seoSlugField(pathKind: 'product' | 'category'): TextField {
  const segment = pathKind === 'category' ? 'categorias' : 'productos'
  const exampleSlug = pathKind === 'category' ? 'vita-green' : 'green-detox'

  return {
    name: 'slug',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    label: 'Slug',
    access: { update: updateUnlessMarketing },
    admin: {
      description: [
        'Qué es: identificador amigable de la URL (sin espacios ni tildes).',
        `Ejemplo: ${exampleSlug}`,
        `URL final ES: /es/${segment}/${exampleSlug}`,
        `URL final EN: /en/${segment}/${exampleSlug}`,
        'Marketing no puede cambiarlo (evita romper enlaces indexados).',
      ].join(' '),
    },
  }
}

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
      'Campos para Google y redes. Si dejas uno vacío, se usan el nombre y la descripción del registro.',
  },
  fields: [
    i18nText(
      'meta_title',
      'Meta Title',
      [
        'Qué es: título azul que aparece en los resultados de Google.',
        'Recomendado: 50–60 caracteres.',
        'Ejemplo ES: Green Detox | Jugo Natural | Vita Green | MiddlePoint',
        'Ejemplo EN: Green Detox | Natural Juice | Vita Green | MiddlePoint',
      ].join(' '),
    ),
    i18nTextarea(
      'meta_description',
      'Meta Description',
      [
        'Qué es: texto gris bajo el título en Google; resume la página.',
        'Recomendado: 140–160 caracteres.',
        'Ejemplo ES: Refrescante jugo natural elaborado con menta, piña, apio, limón y pepino. Disponible para entrega en República Dominicana.',
        'Ejemplo EN: Refreshing natural juice made with mint, pineapple, celery, lemon and cucumber. Available for delivery in the Dominican Republic.',
      ].join(' '),
    ),
    i18nText(
      'keywords',
      'Keywords',
      [
        'Qué es: palabras clave internas para organizar contenido en el CMS (Google ya casi no las usa para ranking).',
        'Ejemplo: green detox, jugo natural, jugo detox, vita green, wellness, healthy juice',
      ].join(' '),
    ),
    i18nText(
      'og_title',
      'Open Graph Title',
      [
        'Qué es: título de la vista previa al compartir el enlace en WhatsApp, Instagram, Facebook, LinkedIn o Telegram.',
        'Ejemplo ES: Green Detox | Vita Green',
        'Ejemplo EN: Green Detox | Vita Green',
      ].join(' '),
    ),
    i18nTextarea(
      'og_description',
      'Open Graph Description',
      [
        'Qué es: texto de la tarjeta de vista previa al compartir el enlace en redes / WhatsApp.',
        'Ejemplo ES: Una refrescante mezcla de ingredientes naturales para complementar tu bienestar.',
        'Ejemplo EN: A refreshing blend of natural ingredients to support your wellness.',
      ].join(' '),
    ),
    {
      name: 'og_image',
      type: 'upload',
      relationTo: 'media',
      label: 'Open Graph Image',
      access: { update: updateAllowMarketing },
      admin: {
        description: [
          'Qué es: imagen de la vista previa al compartir el enlace (WhatsApp, Facebook, etc.).',
          'Ejemplo: foto del producto en horizontal, 1200 × 630 px, JPG o PNG optimizado.',
        ].join(' '),
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
        description: [
          'Qué es: indica a Google si debe mostrar esta página en los resultados de búsqueda.',
          'Ejemplo: Index = sí aparece en Google. No Index = no indexar (útil para borradores o páginas privadas).',
        ].join(' '),
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
      label: 'Vista previa de Google',
      admin: {
        description: [
          'Qué es: simulación de cómo se vería el resultado en Google mientras editas Meta Title y Meta Description.',
          'Ejemplo: título azul + URL verde + descripción gris (como en la SERP).',
        ].join(' '),
        components: {
          Field: '@/components/payload/SeoGooglePreview#SeoGooglePreview',
        },
        custom: { pathKind },
      },
    },
    {
      name: 'seo_structured_data_note',
      type: 'ui',
      label: 'Structured Data (JSON-LD)',
      admin: {
        description: [
          'Qué es: datos estructurados Schema.org para Google (Product o CollectionPage).',
          'Ejemplo: se genera solo; no hay que pegar JSON manualmente.',
        ].join(' '),
        components: {
          Field: '@/components/payload/SeoStructuredDataNote#SeoStructuredDataNote',
        },
      },
    },
  ]
}

export { updateUnlessMarketing, updateAllowMarketing }
