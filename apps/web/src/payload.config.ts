import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
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
import {
  shouldUseVercelBlobStorage,
  vercelBlobStorageFromEnv,
} from './lib/vercel-blob-storage';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

function readEnv(name: string): string | undefined {
  const value = process['env'][name];
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

const databaseUri =
  readEnv('DATABASE_URI') || readEnv('POSTGRES_URL') || readEnv('DATABASE_URL') || '';


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
  secret: readEnv('PAYLOAD_SECRET') || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    // Evita prompts interactivos de drizzle push que congelan el servidor en dev.
    push: readEnv('PAYLOAD_DB_PUSH') === 'true',
    pool: {
      connectionString: databaseUri,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: Number(readEnv('DB_CONNECT_TIMEOUT_MS')) || 10000,
    },
  }),
  sharp,
  plugins: [
    // En Vercel: adaptador que lee BLOB_READ_WRITE_TOKEN en runtime (Sensitive OK).
    // Localmente sin token: disco `media/`.
    ...(shouldUseVercelBlobStorage() ? [vercelBlobStorageFromEnv()] : []),
  ],
  localization: {
    locales: [
      { label: 'Español', code: 'es' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'es',
    fallback: true,
  },
  cors: [readEnv('NEXT_PUBLIC_SERVER_URL') || 'http://localhost:3000'].filter(Boolean),
  csrf: [readEnv('NEXT_PUBLIC_SERVER_URL') || 'http://localhost:3000'].filter(Boolean),
});
