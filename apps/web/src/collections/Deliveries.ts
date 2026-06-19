import type { CollectionConfig } from 'payload';
import { isStaffRole } from '@middlepoint/shared';

export const Deliveries: CollectionConfig = {
  slug: 'deliveries',
  labels: { singular: 'Entrega', plural: 'Entregas' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'status', 'current_order'],
    group: 'Logística',
  },
  access: {
    read: ({ req: { user } }) => isStaffRole(user?.role) || user?.role === 'delivery',
    create: ({ req: { user } }) => isStaffRole(user?.role),
    update: ({ req: { user } }) => isStaffRole(user?.role) || user?.role === 'delivery',
    delete: ({ req: { user } }) => user?.role === 'super_admin',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'available',
      options: [
        { label: 'Disponible', value: 'available' },
        { label: 'Ocupado', value: 'busy' },
        { label: 'Offline', value: 'offline' },
      ],
    },
    {
      name: 'current_order',
      type: 'relationship',
      relationTo: 'orders',
    },
    {
      name: 'delivery_history',
      type: 'json',
      defaultValue: [],
    },
  ],
  timestamps: true,
};
