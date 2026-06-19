/**
 * Ejecutar una vez para sincronizar el esquema de Payload con PostgreSQL:
 *   $env:PAYLOAD_DB_PUSH='true'; $env:PAYLOAD_FORCE_DRIZZLE_PUSH='true'
 *   Write-Output 'y' | npx tsx --env-file=.env src/scripts/push-schema-once.ts
 */
import { getPayload } from 'payload';
import config from '../payload.config';

const payload = await getPayload({ config });
await payload.db.destroy();
console.log('Esquema sincronizado correctamente.');
