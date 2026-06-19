/**
 * Rellena el global store-content con los textos por defecto.
 *   npx tsx --env-file=.env src/scripts/seed-store-content.ts
 */
import { getPayload } from 'payload';
import config from '../payload.config';
import { STORE_CONTENT_SEED } from '../lib/store-content';

const payload = await getPayload({ config });
await payload.updateGlobal({ slug: 'store-content', data: STORE_CONTENT_SEED });
console.log('Contenido del sitio actualizado.');
await payload.db.destroy();
