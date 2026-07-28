import type { CollectionConfig } from 'payload';
import {
  DELIVERY_ASSIGNABLE_ROLES,
  canAccessAdminNav,
  isAdminNavHidden,
  isDeliveryRole,
} from '@middlepoint/shared';

export const Deliveries: CollectionConfig = {
  slug: 'deliveries',
  labels: { singular: 'Entrega', plural: 'Entregas' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'status', 'current_order'],
    group: 'Logística',
    hidden: ({ user }) => isAdminNavHidden(user?.role, 'deliveries'),
  },
  access: {
    // Delivery no gestiona la flota en el panel; solo pedidos asignados.
    admin: ({ req: { user } }) => canAccessAdminNav(user?.role, 'deliveries'),
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (isDeliveryRole(user.role)) return { user: { equals: user.id } };
      return canAccessAdminNav(user.role, 'deliveries');
    },
    create: ({ req: { user } }) => canAccessAdminNav(user?.role, 'deliveries'),
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (isDeliveryRole(user.role)) return { user: { equals: user.id } };
      return canAccessAdminNav(user.role, 'deliveries');
    },
    delete: ({ req: { user } }) => user?.role === 'super_admin',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      filterOptions: {
        role: {
          in: [...DELIVERY_ASSIGNABLE_ROLES],
        },
      },
      access: {
        update: ({ req: { user } }) => canAccessAdminNav(user?.role, 'deliveries'),
      },
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
      access: {
        update: ({ req: { user } }) => canAccessAdminNav(user?.role, 'deliveries'),
      },
    },
    {
      name: 'delivery_history',
      type: 'json',
      defaultValue: [],
      access: {
        update: ({ req: { user } }) => canAccessAdminNav(user?.role, 'deliveries'),
      },
    },
  ],
  timestamps: true,
};
