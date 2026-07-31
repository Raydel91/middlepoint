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

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Producto', plural: 'Productos' },
  admin: {
    useAsTitle: 'slug',
    defaultColumns: ['slug', 'precio', 'activo', 'sales_count', 'featured'],
    group: 'Catálogo',
    hidden: ({ user }) => isAdminNavHidden(user?.role, 'products'),
    description:
      'Marketing puede editar descripción, SEO y galería. Precio, nombre y slug los gestiona administración.',
  },
  access: {
    admin: ({ req: { user } }) => canAccessAdminNav(user?.role, 'products'),
    read: () => true,
    create: ({ req: { user } }) =>
      canAccessAdminNav(user?.role, 'products') && !isMarketingRole(user?.role),
    update: ({ req: { user } }) => canAccessAdminNav(user?.role, 'products'),
    delete: ({ req: { user } }) => isAdminRole(user?.role),
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc, req }) => {
        const guarded = restrictMarketingCatalogUpdate({
          data: data as Record<string, unknown>,
          originalDoc: originalDoc as Record<string, unknown> | null,
          req,
          kind: 'product',
        });

        const galeria = guarded.galeria ?? originalDoc?.galeria;
        const hasGallery = Array.isArray(galeria) && galeria.length > 0;
        if (hasGallery) return guarded;

        const imagen = guarded.imagen ?? originalDoc?.imagen;
        if (!imagen) return guarded;

        const imagenId = typeof imagen === 'object' && imagen && 'id' in imagen ? imagen.id : imagen;
        return { ...guarded, galeria: [imagenId] };
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
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            i18nField('nombre', true, { marketingEditable: false }),
            i18nField('descripcion', true, { marketingEditable: true }),
            i18nField('ingredientes', false, { marketingEditable: false }),
            {
              name: 'precio',
              type: 'number',
              required: true,
              min: 0,
              access: { update: updateUnlessMarketing },
            },
            {
              name: 'calorias',
              type: 'number',
              min: 0,
              access: { update: updateUnlessMarketing },
            },
            {
              name: 'categoria',
              type: 'relationship',
              relationTo: 'categories',
              required: true,
              access: { update: updateUnlessMarketing },
            },
            {
              name: 'atributos',
              type: 'json',
              defaultValue: {},
              access: { update: updateUnlessMarketing },
            },
          ],
        },
        {
          label: 'Galería',
          fields: [
            {
              name: 'galeria',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              label: 'Galería',
              access: { update: updateAllowMarketing },
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
              access: { update: updateAllowMarketing },
              admin: {
                hidden: true,
                description: 'Campo legado. Usa Galería.',
              },
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
                  'Ej: green-detox → /es/productos/green-detox (marketing no puede cambiarlo).',
              },
            },
            seoGroup,
            ...seoTabUiFields('product'),
          ],
        },
        {
          label: 'Social Media',
          fields: [socialGroup],
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      access: { update: updateUnlessMarketing },
      admin: { position: 'sidebar' },
    },
    {
      name: 'sales_count',
      type: 'number',
      defaultValue: 0,
      access: { update: updateUnlessMarketing },
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'view_count',
      type: 'number',
      defaultValue: 0,
      access: { update: updateUnlessMarketing },
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'activo',
      type: 'checkbox',
      defaultValue: true,
      access: { update: updateUnlessMarketing },
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
};
