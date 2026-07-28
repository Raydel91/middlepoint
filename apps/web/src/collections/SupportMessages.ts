import type { CollectionConfig } from 'payload';
import { canAccessAdminNav, canUseStoreAccount, isAdminNavHidden } from '@middlepoint/shared';
import { supportStaffEndpoints } from './support-staff-endpoints';

export const SupportMessages: CollectionConfig = {
  slug: 'support-messages',
  labels: { singular: 'Mensaje de soporte', plural: 'Mensajes de soporte' },
  admin: {
    group: 'Atención al cliente',
    useAsTitle: 'user',
    defaultColumns: ['user', 'status', 'createdAt'],
    description: 'Chats de soporte con clientes. Filtra por estado y responde desde la bandeja.',
    hidden: ({ user }) => isAdminNavHidden(user?.role, 'support-messages'),
    components: {
      views: {
        list: {
          Component: '@/components/payload/SupportMessagesInbox#SupportMessagesInbox',
        },
      },
    },
  },
  access: {
    admin: ({ req: { user } }) => canAccessAdminNav(user?.role, 'support-messages'),
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (canAccessAdminNav(user.role, 'support-messages')) return true;
      return { user: { equals: user.id } };
    },
    create: ({ req: { user } }) => !!user && canUseStoreAccount(user.role),
    update: ({ req: { user } }) => canAccessAdminNav(user?.role, 'support-messages'),
    delete: ({ req: { user } }) => {
      if (!user) return false;
      if (canAccessAdminNav(user.role, 'support-messages')) return true;
      if (canUseStoreAccount(user.role)) return { user: { equals: user.id } };
      return false;
    },
  },
  endpoints: supportStaffEndpoints,
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
      name: 'source',
      type: 'select',
      defaultValue: 'customer',
      options: [
        { label: 'Cliente', value: 'customer' },
        { label: 'Cancelación de pedido', value: 'staff_order_cancel' },
        { label: 'Iniciado por equipo', value: 'staff_initiated' },
      ],
      admin: { readOnly: true },
    },
    {
      name: 'subject',
      type: 'text',
      defaultValue: 'Soporte MiddlePoint',
      admin: { readOnly: true, hidden: true },
    },
    {
      name: 'message',
      type: 'textarea',
      admin: { readOnly: true },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'received',
      options: [
        { label: 'Recibido', value: 'received' },
        { label: 'Respondido', value: 'responded' },
      ],
    },
    {
      name: 'admin_reply',
      type: 'textarea',
      label: 'Respuesta al cliente',
      admin: {
        description: 'Al guardar una respuesta, el cliente recibirá una notificación.',
      },
    },
    {
      name: 'admin_reply_at',
      type: 'date',
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'thread',
      type: 'array',
      label: 'Conversación',
      admin: {
        readOnly: true,
        description: 'Mensajes adicionales del cliente y del equipo en este hilo.',
      },
      fields: [
        {
          name: 'role',
          type: 'select',
          required: true,
          options: [
            { label: 'Cliente', value: 'customer' },
            { label: 'Equipo', value: 'staff' },
          ],
        },
        {
          name: 'body',
          type: 'textarea',
          required: true,
        },
        {
          name: 'sent_at',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'deleted_for_customer',
          type: 'checkbox',
          defaultValue: false,
          admin: { hidden: true },
        },
        {
          name: 'deleted_for_staff',
          type: 'checkbox',
          defaultValue: false,
          admin: { hidden: true },
        },
      ],
    },
    {
      name: 'read_by_customer',
      type: 'checkbox',
      defaultValue: false,
      label: 'Leído por el cliente',
      admin: { readOnly: true },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        if (data.status) {
          data.status =
            data.status === 'answered' || data.status === 'closed'
              ? 'responded'
              : data.status === 'open'
                ? 'received'
                : data.status;
        }

        if (
          data.admin_reply?.trim() &&
          data.admin_reply.trim() !== originalDoc?.admin_reply?.trim()
        ) {
          data.status = 'responded';
          data.read_by_customer = false;
          if (!originalDoc?.admin_reply_at) {
            data.admin_reply_at = new Date().toISOString();
          }
        }
        return data;
      },
    ],
  },
};
