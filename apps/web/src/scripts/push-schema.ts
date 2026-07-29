/**
 * Crea/sincroniza el esquema de Payload en la BD de DATABASE_URI.
 * Solo corre si PAYLOAD_DB_PUSH=true (p. ej. primer deploy en Vercel).
 *
 * Importante: @payloadcms/db-postgres solo ejecuta pushDevSchema cuando
 * NODE_ENV !== 'production'. En el build de Vercel NODE_ENV=production,
 * así que forzamos development solo para este script.
 */
if (process.env.PAYLOAD_DB_PUSH !== 'true') {
  console.log('PAYLOAD_DB_PUSH != true — se omite push de esquema.');
  process.exit(0);
}

if (!process.env.DATABASE_URI) {
  console.error('Falta DATABASE_URI');
  process.exit(1);
}
if (!process.env.PAYLOAD_SECRET) {
  console.error('Falta PAYLOAD_SECRET');
  process.exit(1);
}

process.env.NODE_ENV = 'development';
process.env.PAYLOAD_MIGRATING = 'false';

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

process.exit(0);
