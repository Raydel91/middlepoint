import type { CollectionConfig } from 'payload';
import { canAccessAdminNav, isAdminNavHidden, isAdminRole } from '@middlepoint/shared';

export const TrackingEvents: CollectionConfig = {
  slug: 'tracking-events',
  labels: { singular: 'Evento', plural: 'Eventos de tracking' },
  admin: {
    useAsTitle: 'event',
    defaultColumns: ['event', 'user', 'product', 'createdAt'],
    group: 'Analytics',
    hidden: ({ user }) => isAdminNavHidden(user?.role, 'tracking-events'),
  },
  access: {
    admin: ({ req: { user } }) => canAccessAdminNav(user?.role, 'tracking-events'),
    read: ({ req: { user } }) => canAccessAdminNav(user?.role, 'tracking-events'),
    create: () => true,
    update: () => false,
    delete: ({ req: { user } }) => isAdminRole(user?.role),
  },
  fields: [
    {
      name: 'event',
      type: 'select',
      required: true,
      options: [
        { label: 'Ver producto', value: 'view_product' },
        { label: 'Agregar al carrito', value: 'add_to_cart' },
        { label: 'Inicio checkout', value: 'checkout_start' },
        { label: 'Compra', value: 'purchase' },
      ],
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
    },
    {
      name: 'session_id',
      type: 'text',
    },
    {
      name: 'metadata',
      type: 'json',
    },
  ],
  timestamps: true,
};
