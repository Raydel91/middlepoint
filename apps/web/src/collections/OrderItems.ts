import type { CollectionConfig } from 'payload';
import { canAccessAdminNav, isAdminNavHidden, isAdminRole } from '@middlepoint/shared';

export const OrderItems: CollectionConfig = {
  slug: 'order-items',
  labels: { singular: 'Línea de pedido', plural: 'Líneas de pedido' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['order', 'product', 'quantity', 'price'],
    group: 'Ventas',
    hidden: ({ user }) => isAdminNavHidden(user?.role, 'order-items'),
  },
  access: {
    admin: ({ req: { user } }) => canAccessAdminNav(user?.role, 'order-items'),
    read: ({ req: { user } }) => !!user,
    create: () => true,
    update: ({ req: { user } }) => canAccessAdminNav(user?.role, 'order-items'),
    delete: ({ req: { user } }) => isAdminRole(user?.role),
  },
  fields: [
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      min: 1,
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
    },
  ],
  timestamps: true,
};
