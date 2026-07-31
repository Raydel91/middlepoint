import type { CollectionConfig } from 'payload';
import {
  canAccessAdminNav,
  isAdminNavHidden,
  isAdminRole,
  isMarketingRole,
  isStaffRole,
} from '@middlepoint/shared';

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Archivo', plural: 'Medios' },
  admin: {
    group: 'Catálogo',
    hidden: ({ user }) => isAdminNavHidden(user?.role, 'media'),
  },
  upload: {
    staticDir: 'media',
    // image/* no siempre incluye .svg en el selector; application/xml cubre SVG con <?xml>/<!DOCTYPE>
    mimeTypes: ['image/*', 'image/svg+xml', 'video/*', 'application/xml'],
  },
  access: {
    admin: ({ req: { user } }) =>
      canAccessAdminNav(user?.role, 'media') || isMarketingRole(user?.role),
    read: () => true,
    create: ({ req: { user } }) => isStaffRole(user?.role) || isMarketingRole(user?.role),
    update: ({ req: { user } }) =>
      canAccessAdminNav(user?.role, 'media') || isMarketingRole(user?.role),
    delete: ({ req: { user } }) => isAdminRole(user?.role),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
};
