/**
 * Crea/sincroniza el esquema de Payload en la BD de DATABASE_URI.
 * Solo corre si PAYLOAD_DB_PUSH=true (p. ej. primer deploy en Vercel).
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

const { getPayloadClient } = await import('../lib/payload');

const payload = await getPayloadClient();
console.log('Esquema sincronizado con PostgreSQL.');

const users = await payload.find({
  collection: 'users',
  limit: 1,
  overrideAccess: true,
});
console.log(`Tabla users OK (${users.totalDocs} usuario(s)).`);

process.exit(0);
