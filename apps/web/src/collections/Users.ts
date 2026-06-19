import type { CollectionConfig } from 'payload';
import { isAdminRole, isStaffRole } from '@middlepoint/shared';

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Usuario', plural: 'Usuarios' },
  auth: {
    tokenExpiration: 7200,
    verify: false,
    maxLoginAttempts: 5,
    lockTime: 600 * 1000,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'nombre', 'role', 'createdAt'],
    group: 'Sistema',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (isAdminRole(user.role)) return true;
      return { id: { equals: user.id } };
    },
    create: ({ req: { user } }) => isAdminRole(user?.role),
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (isAdminRole(user.role)) return true;
      return { id: { equals: user.id } };
    },
    delete: ({ req: { user } }) => isAdminRole(user?.role),
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'cliente',
      options: [
        { label: 'Super Admin', value: 'super_admin' },
        { label: 'Operador', value: 'operador' },
        { label: 'Marketing', value: 'marketing' },
        { label: 'Cliente', value: 'cliente' },
        { label: 'Delivery', value: 'delivery' },
      ],
      access: {
        update: ({ req: { user } }) => isAdminRole(user?.role),
      },
    },
    {
      name: 'subRole',
      type: 'text',
      admin: { condition: (_, siblingData) => isStaffRole(siblingData?.role) },
    },
    { name: 'nombre', type: 'text', required: true },
    { name: 'apellido', type: 'text', required: true },
    {
      name: 'telefono',
      type: 'text',
    },
    {
      name: 'delivery_address',
      type: 'group',
      label: 'Dirección de entrega guardada',
      admin: {
        description: 'El cliente puede editarla desde su cuenta. Se usa para precargar el checkout.',
      },
      fields: [
        { name: 'street', type: 'text', label: 'Calle y número' },
        { name: 'city', type: 'text', label: 'Ciudad' },
        { name: 'province', type: 'text', label: 'Provincia' },
        { name: 'reference', type: 'text', label: 'Referencia' },
      ],
    },
    {
      name: 'contact_secondary',
      type: 'group',
      label: 'Contacto secundario',
      admin: {
        description: 'Persona alternativa de contacto para entregas.',
      },
      fields: [
        { name: 'name', type: 'text', label: 'Nombre' },
        { name: 'phone', type: 'text', label: 'Teléfono' },
        { name: 'email', type: 'email', label: 'Email' },
      ],
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      label: 'Foto de perfil',
      admin: {
        description: 'Imagen de perfil del usuario (JPG, PNG, WebP o SVG).',
      },
    },
    {
      name: 'refreshTokenHash',
      type: 'text',
      admin: { hidden: true },
    },
    {
      name: 'refreshTokenExpiresAt',
      type: 'date',
      admin: { hidden: true },
    },
  ],
  timestamps: true,
};
