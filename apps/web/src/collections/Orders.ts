import type { CollectionConfig } from 'payload';
import { isStaffRole } from '@middlepoint/shared';
import { notifyOrderStatusChange } from '@/lib/order-notifications';
import type { OrderStatus } from '@middlepoint/shared';

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Pedido', plural: 'Pedidos' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['id', 'status', 'total', 'payment_method', 'createdAt'],
    group: 'Ventas',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (isStaffRole(user.role)) return true;
      return { user: { equals: user.id } };
    },
    create: () => true,
    update: ({ req: { user } }) => isStaffRole(user?.role) || user?.role === 'delivery',
    delete: ({ req: { user } }) => user?.role === 'super_admin',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'total',
      type: 'number',
      required: true,
      min: 0,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pendiente', value: 'pending' },
        { label: 'Confirmado', value: 'confirmed' },
        { label: 'Preparando', value: 'preparing' },
        { label: 'Listo', value: 'ready' },
        { label: 'En tránsito', value: 'in_transit' },
        { label: 'Entregado', value: 'delivered' },
        { label: 'Cancelado', value: 'cancelled' },
      ],
    },
    {
      name: 'payment_method',
      type: 'select',
      required: true,
      options: [
        { label: 'Efectivo', value: 'cash' },
        { label: 'Transferencia', value: 'transfer' },
      ],
    },
    {
      name: 'address',
      type: 'json',
      required: true,
    },
    {
      name: 'contact_primary',
      type: 'json',
      required: true,
    },
    {
      name: 'contact_secondary',
      type: 'json',
    },
    {
      name: 'scheduled_date',
      type: 'date',
    },
    {
      name: 'scheduled_time',
      type: 'text',
    },
    {
      name: 'delivery',
      type: 'relationship',
      relationTo: 'deliveries',
    },
    {
      name: 'currency',
      type: 'select',
      defaultValue: 'DOP',
      options: [
        { label: 'DOP', value: 'DOP' },
        { label: 'USD', value: 'USD' },
      ],
    },
    {
      name: 'exchange_rate_snapshot',
      type: 'number',
    },
  ],
  timestamps: true,
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        const userId =
          typeof doc.user === 'object' && doc.user !== null ? doc.user.id : doc.user;
        if (!userId) return;

        const status = doc.status as OrderStatus;

        if (operation === 'create') {
          await notifyOrderStatusChange(req.payload, {
            userId,
            orderId: doc.id,
            status,
          });
          return;
        }

        if (operation === 'update' && previousDoc && doc.status !== previousDoc.status) {
          await notifyOrderStatusChange(req.payload, {
            userId,
            orderId: doc.id,
            status,
          });
        }
      },
    ],
  },
};
