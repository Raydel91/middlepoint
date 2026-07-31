import type { Field, GroupField } from 'payload'

const i18nText = (name: string, label: string): Field => ({
  name,
  type: 'group',
  label,
  fields: [
    { name: 'es', type: 'text', label: 'ES' },
    { name: 'en', type: 'text', label: 'EN' },
  ],
})

const i18nTextarea = (name: string, label: string): Field => ({
  name,
  type: 'group',
  label,
  fields: [
    { name: 'es', type: 'textarea', label: 'ES' },
    { name: 'en', type: 'textarea', label: 'EN' },
  ],
})

/** Campos SEO editables (estilo Shopify / WooCommerce) para categorías y productos. */
export const seoGroup: GroupField = {
  name: 'seo',
  type: 'group',
  label: 'SEO',
  admin: {
    description:
      'Optimización para buscadores y redes. Si dejas un campo vacío, se usan el nombre y la descripción del registro.',
  },
  fields: [
    i18nText('meta_title', 'Meta Title'),
    i18nTextarea('meta_description', 'Meta Description'),
    i18nText('keywords', 'Keywords'),
    {
      name: 'canonical_url',
      type: 'text',
      label: 'Canonical URL',
      admin: {
        description: 'Opcional. Si está vacío se usa la URL de esta página.',
      },
    },
    i18nText('og_title', 'Open Graph Title'),
    i18nTextarea('og_description', 'Open Graph Description'),
    {
      name: 'og_image',
      type: 'upload',
      relationTo: 'media',
      label: 'Open Graph Image',
    },
    i18nText('twitter_title', 'Twitter Title'),
    i18nTextarea('twitter_description', 'Twitter Description'),
    {
      name: 'twitter_image',
      type: 'upload',
      relationTo: 'media',
      label: 'Twitter Image',
    },
    {
      name: 'robots',
      type: 'select',
      label: 'Robots',
      defaultValue: 'index, follow',
      options: [
        { label: 'Indexar (index, follow)', value: 'index, follow' },
        { label: 'No indexar (noindex, follow)', value: 'noindex, follow' },
        { label: 'No indexar ni seguir (noindex, nofollow)', value: 'noindex, nofollow' },
      ],
    },
    {
      name: 'structured_data',
      type: 'textarea',
      label: 'Structured Data (JSON-LD)',
      admin: {
        description:
          'JSON-LD opcional. Si está vacío, la tienda genera automáticamente Product o CollectionPage.',
        rows: 8,
      },
    },
  ],
}
