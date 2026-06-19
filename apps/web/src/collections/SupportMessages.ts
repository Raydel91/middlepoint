import type { CollectionConfig } from 'payload';
import { isStaffRole } from '@middlepoint/shared';

export const SupportMessages: CollectionConfig = {
  slug: 'support-messages',
  labels: { singular: 'Mensaje de soporte', plural: 'Mensajes de soporte' },
  admin: {
    group: 'Atención al cliente',
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'user', 'status', 'createdAt'],
    description: 'Mensajes enviados por clientes desde su cuenta. Responde en «Respuesta al cliente».',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (isStaffRole(user.role)) return true;
      return { user: { equals: user.id } };
    },
    create: ({ req: { user } }) => !!user && user.role === 'cliente',
    update: ({ req: { user } }) => isStaffRole(user?.role),
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
      name: 'subject',
      type: 'text',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      options: [
        { label: 'Abierto', value: 'open' },
        { label: 'Respondido', value: 'answered' },
        { label: 'Cerrado', value: 'closed' },
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
      ({ data, originalDoc, req }) => {
        if (
          data.admin_reply?.trim() &&
          data.admin_reply.trim() !== originalDoc?.admin_reply?.trim()
        ) {
          data.status = 'answered';
          data.read_by_customer = false;
        }
        return data;
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        if (operation !== 'update') return;
        const reply = doc.admin_reply?.trim();
        const prevReply = previousDoc?.admin_reply?.trim();
        if (!reply || reply === prevReply) return;

        const userId =
          typeof doc.user === 'object' && doc.user !== null ? doc.user.id : doc.user;
        if (!userId) return;

        await req.payload.create({
          collection: 'customer-notifications',
          data: {
            user: userId,
            type: 'message_reply',
            title: `Respuesta: ${doc.subject}`,
            body: reply,
            read: false,
          },
          overrideAccess: true,
        });
      },
    ],
  },
};
