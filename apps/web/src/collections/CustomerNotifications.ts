import type { CollectionConfig } from 'payload';
import { canAccessAdminNav, canUseStoreAccount, isAdminNavHidden, isAdminRole } from '@middlepoint/shared';

export const CustomerNotifications: CollectionConfig = {
  slug: 'customer-notifications',
  labels: { singular: 'Notificación', plural: 'Notificaciones de clientes' },
  admin: {
    group: 'Atención al cliente',
    useAsTitle: 'title',
    defaultColumns: ['title', 'user', 'type', 'read', 'createdAt'],
    description: 'Avisos automáticos de pedidos y respuestas a mensajes de soporte.',
    hidden: ({ user }) => isAdminNavHidden(user?.role, 'customer-notifications'),
  },
  access: {
    admin: ({ req: { user } }) => canAccessAdminNav(user?.role, 'customer-notifications'),
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (canAccessAdminNav(user.role, 'customer-notifications')) return true;
      return { user: { equals: user.id } };
    },
    create: ({ req: { user } }) => canAccessAdminNav(user?.role, 'customer-notifications'),
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (canAccessAdminNav(user.role, 'customer-notifications')) return true;
      return { user: { equals: user.id } };
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      if (isAdminRole(user.role)) return true;
      if (canUseStoreAccount(user.role)) return { user: { equals: user.id } };
      return false;
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
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      admin: { readOnly: true },
    },
    {
      name: 'support_message',
      type: 'relationship',
      relationTo: 'support-messages',
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
