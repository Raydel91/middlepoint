/**
 * Crea/sincroniza el esquema de Payload en la BD (DATABASE_URI o POSTGRES_URL).
 * Solo corre si PAYLOAD_DB_PUSH=true (p. ej. primer deploy / cambios de schema en Vercel).
 *
 * Importante: @payloadcms/db-postgres solo ejecuta pushDevSchema cuando
 * NODE_ENV !== 'production'. En el build de Vercel NODE_ENV=production,
 * así que forzamos development solo para este script.
 *
 * Antes del push, elimina columnas SEO obsoletas (Twitter / canonical / JSON-LD editable)
 * para que drizzle-kit no pregunte de forma interactiva "create or rename" (rompe CI).
 */
if (process.env.PAYLOAD_DB_PUSH !== 'true') {
  console.log('PAYLOAD_DB_PUSH != true — se omite push de esquema.');
  process.exit(0);
}

const databaseUri =
  process.env.DATABASE_URI || process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!databaseUri) {
  console.error('Falta DATABASE_URI o POSTGRES_URL');
  process.exit(1);
}
process.env.DATABASE_URI = databaseUri;
if (!process.env.PAYLOAD_SECRET) {
  console.error('Falta PAYLOAD_SECRET');
  process.exit(1);
}

process.env.NODE_ENV = 'development';
process.env.PAYLOAD_MIGRATING = 'false';
process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = 'true';

const { Client } = await import('pg');

/** Columnas del SEO antiguo que ya no existen en el schema (provocan prompts rename). */
const OBSOLETE_SEO_COLUMNS = [
  'seo_canonical_url',
  'seo_twitter_title_es',
  'seo_twitter_title_en',
  'seo_twitter_description_es',
  'seo_twitter_description_en',
  'seo_twitter_image_id',
  'seo_structured_data',
] as const;

async function dropObsoleteSeoColumns() {
  const client = new Client({
    connectionString: databaseUri,
    connectionTimeoutMillis: 15000,
  });
  await client.connect();
  try {
    for (const table of ['categories', 'products']) {
      for (const column of OBSOLETE_SEO_COLUMNS) {
        await client.query(
          `ALTER TABLE IF EXISTS "${table}" DROP COLUMN IF EXISTS "${column}"`,
        );
        console.log(`OK: drop ${table}.${column} (si existía)`);
      }
    }
  } finally {
    await client.end();
  }
}

console.log('Eliminando columnas SEO obsoletas (anti-prompt drizzle)…');
await dropObsoleteSeoColumns();

const { getPayload } = await import('payload');
const config = (await import('@/payload.config')).default;

const payload = await getPayload({ config });
console.log('Esquema sincronizado con PostgreSQL (pushDevSchema).');

const users = await payload.find({
  collection: 'users',
  limit: 1,
  overrideAccess: true,
});
console.log(`Tabla users OK (${users.totalDocs} usuario(s)).`);

await payload.db.destroy();
process.exit(0);
