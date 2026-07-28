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

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Producto', plural: 'Productos' },
  admin: {
    useAsTitle: 'slug',
    defaultColumns: ['slug', 'precio', 'activo', 'sales_count', 'featured'],
    group: 'Catálogo',
    hidden: ({ user }) => isAdminNavHidden(user?.role, 'products'),
  },
  access: {
    admin: ({ req: { user } }) => canAccessAdminNav(user?.role, 'products'),
    read: () => true,
    create: ({ req: { user } }) => canAccessAdminNav(user?.role, 'products'),
    update: ({ req: { user } }) => canAccessAdminNav(user?.role, 'products'),
    delete: ({ req: { user } }) => isAdminRole(user?.role),
  },
  fields: [
    i18nField('nombre'),
    i18nField('descripcion'),
    i18nField('ingredientes', false),
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'precio',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'calorias',
      type: 'number',
      min: 0,
    },
    {
      name: 'categoria',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'galeria',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'Galería',
      admin: {
        description: 'Hasta 5 imágenes o videos para el producto.',
      },
      validate: (value) => {
        if (Array.isArray(value) && value.length > 5) {
          return 'Puedes subir un máximo de 5 imágenes o videos.';
        }
        return true;
      },
    },
    {
      name: 'imagen',
      type: 'upload',
      relationTo: 'media',
      admin: {
        hidden: true,
        description: 'Campo legado. Usa Galería.',
      },
    },
    {
      name: 'atributos',
      type: 'json',
      defaultValue: {},
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'sales_count',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'view_count',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'activo',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        const galeria = data.galeria ?? originalDoc?.galeria;
        const hasGallery = Array.isArray(galeria) && galeria.length > 0;
        if (hasGallery) return data;

        const imagen = data.imagen ?? originalDoc?.imagen;
        if (!imagen) return data;

        const imagenId = typeof imagen === 'object' ? imagen.id : imagen;
        data.galeria = [imagenId];
        return data;
      },
    ],
    afterRead: [
      ({ doc }) => {
        const seen = new Set<string | number>();
        const merged: NonNullable<typeof doc.galeria> = [];

        const add = (item: (typeof merged)[number] | null | undefined) => {
          if (item == null) return;
          const id = typeof item === 'object' ? item.id : item;
          if (seen.has(id)) return;
          seen.add(id);
          merged.push(item);
        };

        if (Array.isArray(doc.galeria)) {
          for (const item of doc.galeria) add(item);
        }
        add(doc.imagen as (typeof merged)[number] | null | undefined);

        doc.galeria = merged;
        return doc;
      },
    ],
  },
  timestamps: true,
};
