import type { CollectionConfig } from 'payload';
import { isStaffRole } from '@middlepoint/shared';

export const CustomerNotifications: CollectionConfig = {
  slug: 'customer-notifications',
  labels: { singular: 'Notificación', plural: 'Notificaciones de clientes' },
  admin: {
    group: 'Atención al cliente',
    useAsTitle: 'title',
    defaultColumns: ['title', 'user', 'type', 'read', 'createdAt'],
    description: 'Avisos automáticos de pedidos y respuestas a mensajes de soporte.',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (isStaffRole(user.role)) return true;
      return { user: { equals: user.id } };
    },
    create: ({ req: { user } }) => isStaffRole(user?.role),
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (isStaffRole(user.role)) return true;
      return { user: { equals: user.id } };
    },
    delete: ({ req: { user } }) => user?.role === 'super_admin',
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
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      admin: { readOnly: true },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'system',
      options: [
        { label: 'Estado de pedido', value: 'order_status' },
        { label: 'Respuesta de soporte', value: 'message_reply' },
        { label: 'Sistema', value: 'system' },
      ],
      admin: { readOnly: true },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'read',
      type: 'checkbox',
      defaultValue: false,
      label: 'Leída',
    },
  ],
  timestamps: true,
};
