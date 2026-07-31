/**
 * Crea/sincroniza el esquema de Payload en la BD (DATABASE_URI o POSTGRES_URL).
 * Solo corre si PAYLOAD_DB_PUSH=true (p. ej. primer deploy / cambios de schema en Vercel).
 *
 * Importante: @payloadcms/db-postgres solo ejecuta pushDevSchema cuando
 * NODE_ENV !== 'production'. En el build de Vercel NODE_ENV=production,
 * así que forzamos development solo para este script.
 *
 * Antes del push:
 * - elimina columnas SEO obsoletas (Twitter / canonical / JSON-LD editable)
 *   para que drizzle-kit no pregunte "create or rename" (rompe CI).
 * - normaliza seo_robots a index|noindex (evita fallo de CAST a enum).
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

async function prepareSeoColumnsForPush() {
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

      // Enum Payload solo admite index|noindex. Datos viejos en varchar
      // ("index, follow") rompen el ALTER TYPE; si ya es enum, no ILIKE.
      const robotsCol = await client.query<{
        data_type: string;
        udt_name: string;
      }>(
        `SELECT data_type, udt_name
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = $1
           AND column_name = 'seo_robots'`,
        [table],
      );
      const robotsMeta = robotsCol.rows[0];
      if (!robotsMeta) continue;

      if (
        robotsMeta.data_type === 'USER-DEFINED' ||
        robotsMeta.udt_name.startsWith('enum_')
      ) {
        console.log(`OK: skip normalize ${table}.seo_robots (ya es enum)`);
        continue;
      }

      const result = await client.query(
        `UPDATE "${table}"
         SET seo_robots = CASE
           WHEN seo_robots::text ILIKE '%noindex%' THEN 'noindex'
           ELSE 'index'
         END
         WHERE seo_robots::text IS DISTINCT FROM 'index'
           AND seo_robots::text IS DISTINCT FROM 'noindex'`,
      );
      console.log(
        `OK: normalize ${table}.seo_robots (${result.rowCount ?? 0} fila(s))`,
      );
    }
  } finally {
    await client.end();
  }
}

console.log('Preparando columnas SEO (drop obsoletas + normalize robots)…');
await prepareSeoColumnsForPush();

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
