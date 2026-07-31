import type { CollectionConfig } from 'payload';
import {
  canAccessAdminNav,
  isAdminNavHidden,
  isAdminRole,
  isMarketingRole,
} from '@middlepoint/shared';
import { updateAllowMarketing, updateUnlessMarketing } from '../fields/access';
import { seoGroup, seoTabUiFields } from '../fields/seo';
import { socialGroup } from '../fields/social';
import { restrictMarketingCatalogUpdate } from '../lib/marketing-catalog-guard';

const i18nField = (
  name: string,
  required = true,
  opts?: { marketingEditable?: boolean },
) => ({
  name,
  type: 'group' as const,
  access: {
    update: opts?.marketingEditable ? updateAllowMarketing : updateUnlessMarketing,
  },
  fields: [
    {
      name: 'es',
      type: 'text' as const,
      required,
      access: {
        update: opts?.marketingEditable ? updateAllowMarketing : updateUnlessMarketing,
      },
    },
    {
      name: 'en',
      type: 'text' as const,
      required,
      access: {
        update: opts?.marketingEditable ? updateAllowMarketing : updateUnlessMarketing,
      },
    },
  ],
});

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Categoría', plural: 'Categorías' },
  admin: {
    useAsTitle: 'slug',
    defaultColumns: ['slug', 'orden', 'updatedAt'],
    group: 'Catálogo',
    hidden: ({ user }) => isAdminNavHidden(user?.role, 'categories'),
    description:
      'Marketing puede editar descripción, SEO, imagen y redes. El resto lo gestiona administración.',
  },
  access: {
    admin: ({ req: { user } }) => canAccessAdminNav(user?.role, 'categories'),
    read: () => true,
    create: ({ req: { user } }) =>
      canAccessAdminNav(user?.role, 'categories') && !isMarketingRole(user?.role),
    update: ({ req: { user } }) => canAccessAdminNav(user?.role, 'categories'),
    delete: ({ req: { user } }) => isAdminRole(user?.role),
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc, req }) =>
        restrictMarketingCatalogUpdate({
          data: data as Record<string, unknown>,
          originalDoc: originalDoc as Record<string, unknown> | null,
          req,
          kind: 'category',
        }),
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            i18nField('nombre', true, { marketingEditable: false }),
            i18nField('descripcion', false, { marketingEditable: true }),
            {
              name: 'imagen',
              type: 'upload',
              relationTo: 'media',
              access: { update: updateAllowMarketing },
              admin: { description: 'Imagen / logo de la categoría' },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              access: { update: updateUnlessMarketing },
              admin: {
                description:
                  'URL amigable. Ej: green-detox → /es/categorias/green-detox (marketing no puede cambiarlo).',
              },
            },
            seoGroup,
            ...seoTabUiFields('category'),
          ],
        },
        {
          label: 'Social Media',
          fields: [
            socialGroup,
            {
              name: 'instagram_url',
              type: 'text',
              label: 'Instagram URL (compatibilidad)',
              access: { update: updateAllowMarketing },
              admin: {
                description:
                  'Usa preferentemente Social Media → Instagram URL. Este campo se mantiene por datos antiguos.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'orden',
      type: 'number',
      defaultValue: 0,
      access: { update: updateUnlessMarketing },
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
};
