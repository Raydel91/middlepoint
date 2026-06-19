/**
 * Copia imagen legada a galería en productos que aún no tienen relaciones.
 * Ejecutar: npx tsx --env-file=.env src/scripts/migrate-imagen-to-galeria.ts
 */
import { getPayload } from 'payload';
import config from '../payload.config';

const payload = await getPayload({ config });

const products = await payload.find({
  collection: 'products',
  limit: 500,
  depth: 0,
});

let updated = 0;

for (const product of products.docs) {
  const imagenId = typeof product.imagen === 'number' ? product.imagen : null;
  if (!imagenId) continue;

  const rels = await payload.db.execute({
    drizzle: payload.db.drizzle,
    raw: `SELECT id FROM products_rels WHERE parent_id = ${product.id} AND path = 'galeria' LIMIT 1`,
  });

  if (rels.rows.length > 0) continue;

  await payload.update({
    collection: 'products',
    id: product.id,
    data: { galeria: [imagenId] },
  });
  console.log(`Migrado producto ${product.id} (${product.slug}): galería = [${imagenId}]`);
  updated++;
}

console.log(`Listo. ${updated} producto(s) actualizado(s).`);
await payload.db.destroy();
