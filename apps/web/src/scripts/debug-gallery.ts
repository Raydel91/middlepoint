import { getPayload } from 'payload';
import config from '../payload.config';
import { createServices } from '../services';
import { normalizeRouteSlug } from '../lib/slug';
import { resolveMediaList } from '../lib/media';

const slug = normalizeRouteSlug('ch%C3%ADa-jugo-juice-verde-natural');
const payload = await getPayload({ config });
const services = createServices(payload);

const product = await services.product.getBySlug(slug);
console.log('slug:', product?.slug);
console.log('galeria raw:', JSON.stringify(product?.galeria, null, 2));
console.log('imagen raw:', product?.imagen);
console.log('resolved:', resolveMediaList(product?.galeria));

const direct = await payload.find({
  collection: 'products',
  where: { slug: { equals: slug } },
  limit: 1,
  depth: 2,
});
console.log('depth 2 galeria count:', direct.docs[0]?.galeria?.length);

await payload.db.destroy();
