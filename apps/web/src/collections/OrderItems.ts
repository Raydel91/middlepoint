import type { CollectionConfig } from 'payload';
import { isStaffRole } from '@middlepoint/shared';

export const OrderItems: CollectionConfig = {
  slug: 'order-items',
  labels: { singular: 'Línea de pedido', plural: 'Líneas de pedido' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['order', 'product', 'quantity', 'price'],
    group: 'Ventas',
  },
  access: {
    read: ({ req: { user } }) => !!user,
    create: () => true,
    update: ({ req: { user } }) => isStaffRole(user?.role),
    delete: ({ req: { user } }) => user?.role === 'super_admin',
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
};
