/**
 * Migra enum_support_messages_status: open→received, answered→responded.
 * Ejecutar: npx tsx --env-file=.env src/scripts/migrate-support-status-enum.ts
 */
import pg from 'pg';

const connectionString = process.env.DATABASE_URI;
if (!connectionString) {
  console.error('DATABASE_URI no está definida');
  process.exit(1);
}

const client = new pg.Client({ connectionString });
await client.connect();

const enumName = 'enum_support_messages_status';

async function getEnumLabels(): Promise<string[]> {
  const result = await client.query<{ enumlabel: string }>(
    `SELECT e.enumlabel
     FROM pg_enum e
     JOIN pg_type t ON e.enumtypid = t.oid
     WHERE t.typname = $1
     ORDER BY e.enumsortorder`,
    [enumName],
  );
  return result.rows.map((r) => r.enumlabel);
}

try {
  const labels = await getEnumLabels();
  console.log('Valores actuales del enum:', labels.join(', '));

  if (labels.includes('received') && labels.includes('responded')) {
    console.log('El enum ya está migrado.');
    process.exit(0);
  }

  if (labels.includes('closed')) {
    await client.query(
      `UPDATE support_messages SET status = 'answered' WHERE status::text = 'closed'`,
    );
    console.log('Filas con closed actualizadas a answered.');
  }

  if (labels.includes('open') && !labels.includes('received')) {
    await client.query(`ALTER TYPE ${enumName} RENAME VALUE 'open' TO 'received'`);
    console.log('open → received');
  }

  if (labels.includes('answered') && !labels.includes('responded')) {
    await client.query(`ALTER TYPE ${enumName} RENAME VALUE 'answered' TO 'responded'`);
    console.log('answered → responded');
  }

  const updated = await getEnumLabels();
  console.log('Valores finales del enum:', updated.join(', '));
  console.log('Migración completada.');
} catch (error) {
  console.error('Error en migración:', error);
  process.exit(1);
} finally {
  await client.end();
}
