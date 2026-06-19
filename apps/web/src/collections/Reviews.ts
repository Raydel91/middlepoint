import type { CollectionConfig } from 'payload';
import { isStaffRole } from '@middlepoint/shared';

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'Reseña', plural: 'Reseñas' },
  admin: {
    group: 'Contenido',
    useAsTitle: 'author_name',
    defaultColumns: ['author_name', 'rating', 'approved', 'createdAt'],
    description: 'Reseñas de clientes. Aprueba las que quieras mostrar en el inicio.',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return { approved: { equals: true } };
      if (isStaffRole(user.role)) return true;
      return {
        or: [{ approved: { equals: true } }, { user: { equals: user.id } }],
      };
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (isStaffRole(user.role)) return true;
      return { user: { equals: user.id } };
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === 'super_admin') return true;
      return { user: { equals: user.id } };
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'author_name',
      type: 'text',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
    },
    {
      name: 'comment',
      type: 'textarea',
      required: true,
    },
    {
      name: 'approved',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Solo las reseñas aprobadas aparecen en la página de inicio.',
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create' && req.user && !data.user) {
          data.user = req.user.id;
          data.author_name = `${req.user.nombre} ${req.user.apellido}`.trim();
        }
        if (operation === 'create' && data.approved === undefined) {
          data.approved = false;
        }
        if (operation === 'update' && req.user && !isStaffRole(req.user.role)) {
          data.approved = false;
          delete data.user;
          delete data.author_name;
        }
        return data;
      },
    ],
  },
};
