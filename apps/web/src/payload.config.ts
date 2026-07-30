import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob';
import path from 'path';
import { buildConfig } from 'payload';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

import { Users } from './collections/Users';
import { Categories } from './collections/Categories';
import { Products } from './collections/Products';
import { Orders } from './collections/Orders';
import { OrderItems } from './collections/OrderItems';
import { Deliveries } from './collections/Deliveries';
import { Media } from './collections/Media';
import { TrackingEvents } from './collections/TrackingEvents';
import { Settings } from './globals/Settings';
import { StoreContent } from './globals/StoreContent';
import { Reviews } from './collections/Reviews';
import { CustomerNotifications } from './collections/CustomerNotifications';
import { SupportMessages } from './collections/SupportMessages';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
const databaseUri =
  process.env.DATABASE_URI ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  '';


export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      title: 'Middle Point Admin',
      titleSuffix: '· Panel',
      description: 'Panel de administración — Tu Punto Medio',
      icons: [{ url: '/icono.svg', type: 'image/svg+xml' }],
    },
    theme: 'all',
    dateFormat: 'dd/MM/yyyy',
    components: {
      graphics: {
        Logo: '@/components/payload/Logo',
        Icon: '@/components/payload/Icon',
      },
      beforeDashboard: ['@/components/payload/BeforeDashboard'],
      afterNavLinks: ['@/components/payload/AdminLogoutButton'],
    },
  },
  collections: [
    Users,
    Categories,
    Products,
    Orders,
    OrderItems,
    Deliveries,
    Media,
    TrackingEvents,
    Reviews,
    CustomerNotifications,
    SupportMessages,
  ],
  globals: [Settings, StoreContent],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    // Evita prompts interactivos de drizzle push que congelan el servidor en dev.
    push: process.env.PAYLOAD_DB_PUSH === 'true',
    pool: {
      connectionString: databaseUri,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 10000,
    },
  }),
  sharp,
  plugins: [
    // En Vercel el disco es efímero; sin Blob las subidas de media fallan al guardar.
    vercelBlobStorage({
      enabled: Boolean(blobToken),
      collections: {
        media: true,
      },
      token: blobToken,
      // Límite de body ~4.5MB en serverless; sube directo al Blob desde el admin.
      clientUploads: true,
    }),
  ],
  localization: {
    locales: [
      { label: 'Español', code: 'es' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'es',
    fallback: true,
  },
  cors: [process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'].filter(Boolean),
  csrf: [process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'].filter(Boolean),
});
