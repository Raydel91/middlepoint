import type { CollectionConfig } from 'payload';
import { canAccessAdminNav, isAdminNavHidden, isAdminRole } from '@middlepoint/shared';

const i18nField = (name: string, required = true) => ({
  name,
  type: 'group' as const,
  fields: [
    { name: 'es', type: 'text' as const, required },
    { name: 'en', type: 'text' as const, required },
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
  },
  access: {
    admin: ({ req: { user } }) => canAccessAdminNav(user?.role, 'categories'),
    read: () => true,
    create: ({ req: { user } }) => canAccessAdminNav(user?.role, 'categories'),
    update: ({ req: { user } }) => canAccessAdminNav(user?.role, 'categories'),
    delete: ({ req: { user } }) => isAdminRole(user?.role),
  },
  fields: [
    i18nField('nombre'),
    i18nField('descripcion', false),
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'imagen',
      type: 'upload',
      relationTo: 'media',
    },
    { name: 'instagram_url', type: 'text', label: 'URL de Instagram' },
    {
      name: 'orden',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
};
