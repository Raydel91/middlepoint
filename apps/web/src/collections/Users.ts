import type { CollectionConfig, Where } from 'payload';
import { APIError } from 'payload';
import {
  DELIVERY_ASSIGNABLE_ROLES,
  isAdminNavHidden,
  isAdminRole,
  isDeliveryRole,
  isOperadorRole,
  isStaffRole,
} from '@middlepoint/shared';

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
    useAsTitle: 'nombreCompleto',
    defaultColumns: ['email', 'nombre', 'role', 'createdAt'],
    group: 'Sistema',
    hidden: ({ user }) => isAdminNavHidden(user?.role, 'users'),
  },
  access: {
    // Solo staff (no cliente) entra al admin de usuarios.
    admin: ({ req: { user } }) => isStaffRole(user?.role),
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (isAdminRole(user.role)) return true;
      // Operador necesita ver usuarios asignables como delivery.
      if (isOperadorRole(user.role)) {
        return {
          or: [
            { id: { equals: user.id } },
            { role: { in: [...DELIVERY_ASSIGNABLE_ROLES] } },
          ],
        } as Where;
      }
      // Delivery / marketing / resto: solo su propio usuario.
      return { id: { equals: user.id } } as Where;
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
      name: 'nombreCompleto',
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            const name = [siblingData?.nombre, siblingData?.apellido]
              .filter((part) => typeof part === 'string' && part.trim())
              .join(' ')
              .trim();
            return name || siblingData?.email || '';
          },
        ],
        afterRead: [
          ({ value, siblingData }) => {
            if (typeof value === 'string' && value.trim()) return value;
            const name = [siblingData?.nombre, siblingData?.apellido]
              .filter((part) => typeof part === 'string' && part.trim())
              .join(' ')
              .trim();
            return name || siblingData?.email || value;
          },
        ],
      },
    },
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
        condition: (_, __, { user }) => !isDeliveryRole(user?.role),
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
        condition: (_, __, { user }) => !isDeliveryRole(user?.role),
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
  hooks: {
    beforeLogin: [
      async ({ user, req }) => {
        const referer = req.headers?.get('referer') ?? '';
        const isAdminLogin = referer.includes('/admin');
        if (isAdminLogin && !isStaffRole(user.role)) {
          throw new APIError(
            'Solo el personal autorizado puede acceder al panel de administración.',
            403,
          );
        }
        return user;
      },
    ],
  },
  timestamps: true,
};
