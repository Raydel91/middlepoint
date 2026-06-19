import type { CollectionConfig } from 'payload';
import { isStaffRole } from '@middlepoint/shared';

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Archivo', plural: 'Medios' },
  admin: {
    group: 'Catálogo',
  },
  upload: {
    staticDir: 'media',
    // image/* no siempre incluye .svg en el selector; application/xml cubre SVG con <?xml>/<!DOCTYPE>
    mimeTypes: ['image/*', 'image/svg+xml', 'video/*', 'application/xml'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => isStaffRole(user?.role),
    update: ({ req: { user } }) => isStaffRole(user?.role),
    delete: ({ req: { user } }) => user?.role === 'super_admin',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
};
