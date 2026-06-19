import { getPayload } from 'payload';
import config from '../payload.config';
import { STORE_CONTENT_SEED } from '../lib/store-content';

async function seed() {
  console.log('🌱 Seeding MiddlePoint database...');

  const payload = await getPayload({ config });

  await payload.updateGlobal({
    slug: 'settings',
    data: { exchange_rate_usd: 58.5, marketing_spend: 150000 },
  });

  await payload.updateGlobal({
    slug: 'store-content',
    data: STORE_CONTENT_SEED,
  });
  console.log('✅ Contenido del sitio (páginas, legal, FAQ, contacto) seeded');

  const adminExists = await payload.find({
    collection: 'users',
    where: { email: { equals: 'admin@middlepoint.do' } },
    limit: 1,
  });

  if (adminExists.docs.length === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email: 'admin@middlepoint.do',
        password: 'Admin123!',
        nombre: 'Admin',
        apellido: 'MiddlePoint',
        role: 'super_admin',
        telefono: '809-555-0100',
      },
    });
    console.log('✅ Super admin created: admin@middlepoint.do / Admin123!');
  }

  const categoriesData = [
    {
      slug: 'bowls',
      nombre: { es: 'Bowls Energéticos', en: 'Energy Bowls' },
      descripcion: {
        es: 'Bowls nutritivos con superfoods tropicales',
        en: 'Nutritious bowls with tropical superfoods',
      },
      orden: 1,
    },
    {
      slug: 'smoothies',
      nombre: { es: 'Smoothies', en: 'Smoothies' },
      descripcion: {
        es: 'Bebidas naturales y refrescantes',
        en: 'Natural and refreshing drinks',
      },
      orden: 2,
    },
    {
      slug: 'snacks',
      nombre: { es: 'Snacks Saludables', en: 'Healthy Snacks' },
      descripcion: {
        es: 'Bocadillos guilt-free para tu día',
        en: 'Guilt-free snacks for your day',
      },
      orden: 3,
    },
    {
      slug: 'combos',
      nombre: { es: 'Combos Wellness', en: 'Wellness Combos' },
      descripcion: {
        es: 'Paquetes equilibrados con descuento',
        en: 'Balanced packages with discount',
      },
      orden: 4,
    },
  ];

  const categoryMap: Record<string, number | string> = {};

  for (const cat of categoriesData) {
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: cat.slug } },
      limit: 1,
    });
    if (existing.docs.length > 0) {
      categoryMap[cat.slug] = existing.docs[0].id;
    } else {
      const created = await payload.create({ collection: 'categories', data: cat });
      categoryMap[cat.slug] = created.id;
    }
  }

  const productsData = [
    {
      slug: 'bowl-acai-tropical',
      nombre: { es: 'Bowl Açaí Tropical', en: 'Tropical Açaí Bowl' },
      descripcion: {
        es: 'Açaí orgánico con mango, plátano, granola artesanal y miel de abeja dominicana',
        en: 'Organic açaí with mango, banana, artisan granola and Dominican honey',
      },
      ingredientes: {
        es: 'Açaí, mango, plátano, granola, miel, coco rallado',
        en: 'Açaí, mango, banana, granola, honey, shredded coconut',
      },
      precio: 650,
      calorias: 420,
      categoria: categoryMap.bowls,
      featured: true,
      sales_count: 156,
      view_count: 890,
    },
    {
      slug: 'bowl-quinoa-verde',
      nombre: { es: 'Bowl Quinoa Verde', en: 'Green Quinoa Bowl' },
      descripcion: {
        es: 'Quinoa tricolor con aguacate, edamame, kale y aderezo de limón',
        en: 'Tri-color quinoa with avocado, edamame, kale and lemon dressing',
      },
      ingredientes: {
        es: 'Quinoa, aguacate, edamame, kale, limón, aceite de oliva',
        en: 'Quinoa, avocado, edamame, kale, lemon, olive oil',
      },
      precio: 580,
      calorias: 380,
      categoria: categoryMap.bowls,
      featured: true,
      sales_count: 98,
      view_count: 456,
    },
    {
      slug: 'smoothie-verde-detox',
      nombre: { es: 'Smoothie Verde Detox', en: 'Green Detox Smoothie' },
      descripcion: {
        es: 'Espinaca, piña, jengibre y linaza para una limpieza natural',
        en: 'Spinach, pineapple, ginger and flaxseed for natural cleansing',
      },
      ingredientes: {
        es: 'Espinaca, piña, jengibre, linaza, agua de coco',
        en: 'Spinach, pineapple, ginger, flaxseed, coconut water',
      },
      precio: 350,
      calorias: 180,
      categoria: categoryMap.smoothies,
      featured: false,
      sales_count: 234,
      view_count: 1200,
    },
    {
      slug: 'smoothie-proteina-cacao',
      nombre: { es: 'Smoothie Proteína Cacao', en: 'Cacao Protein Smoothie' },
      descripcion: {
        es: 'Proteína vegetal con cacao dominicano y mantequilla de maní',
        en: 'Plant protein with Dominican cacao and peanut butter',
      },
      ingredientes: {
        es: 'Proteína vegetal, cacao, maní, plátano, leche de almendras',
        en: 'Plant protein, cacao, peanut, banana, almond milk',
      },
      precio: 420,
      calorias: 320,
      categoria: categoryMap.smoothies,
      featured: true,
      sales_count: 187,
      view_count: 678,
    },
    {
      slug: 'energy-balls-coco',
      nombre: { es: 'Energy Balls de Coco', en: 'Coconut Energy Balls' },
      descripcion: {
        es: 'Bolitas energéticas con dátiles, coco y almendras (pack de 6)',
        en: 'Energy balls with dates, coconut and almonds (pack of 6)',
      },
      ingredientes: {
        es: 'Dátiles, coco, almendras, cacao, vainilla',
        en: 'Dates, coconut, almonds, cacao, vanilla',
      },
      precio: 280,
      calorias: 150,
      categoria: categoryMap.snacks,
      featured: false,
      sales_count: 312,
      view_count: 890,
    },
    {
      slug: 'granola-artesanal',
      nombre: { es: 'Granola Artesanal', en: 'Artisan Granola' },
      descripcion: {
        es: 'Granola horneada con avena, nueces y frutas deshidratadas (400g)',
        en: 'Baked granola with oats, nuts and dried fruits (400g)',
      },
      ingredientes: {
        es: 'Avena, nueces, almendras, arándanos secos, miel',
        en: 'Oats, walnuts, almonds, dried cranberries, honey',
      },
      precio: 450,
      calorias: 200,
      categoria: categoryMap.snacks,
      featured: false,
      sales_count: 145,
      view_count: 567,
    },
    {
      slug: 'combo-balance-semanal',
      nombre: { es: 'Combo Balance Semanal', en: 'Weekly Balance Combo' },
      descripcion: {
        es: '5 bowls + 5 smoothies para tu semana wellness completa',
        en: '5 bowls + 5 smoothies for your complete wellness week',
      },
      ingredientes: {
        es: 'Variedad de bowls y smoothies del menú',
        en: 'Variety of bowls and smoothies from the menu',
      },
      precio: 4500,
      calorias: 0,
      categoria: categoryMap.combos,
      featured: true,
      sales_count: 67,
      view_count: 345,
      atributos: { isCombo: true, comboItems: ['bowl', 'smoothie'] },
    },
    {
      slug: 'combo-detox-3-dias',
      nombre: { es: 'Combo Detox 3 Días', en: '3-Day Detox Combo' },
      descripcion: {
        es: 'Programa de 3 días con smoothies verdes y snacks saludables',
        en: '3-day program with green smoothies and healthy snacks',
      },
      ingredientes: {
        es: 'Smoothies verdes, energy balls, agua de coco',
        en: 'Green smoothies, energy balls, coconut water',
      },
      precio: 2800,
      calorias: 0,
      categoria: categoryMap.combos,
      featured: true,
      sales_count: 43,
      view_count: 234,
      atributos: { isCombo: true, comboItems: ['smoothie', 'snack'] },
    },
  ];

  for (const product of productsData) {
    const existing = await payload.find({
      collection: 'products',
      where: { slug: { equals: product.slug } },
      limit: 1,
    });
    if (existing.docs.length === 0) {
      await payload.create({
        collection: 'products',
        data: { ...product, activo: true },
      });
    }
  }

  const deliveryUser = await payload.find({
    collection: 'users',
    where: { email: { equals: 'delivery@middlepoint.do' } },
    limit: 1,
  });

  if (deliveryUser.docs.length === 0) {
    const user = await payload.create({
      collection: 'users',
      data: {
        email: 'delivery@middlepoint.do',
        password: 'Delivery123!',
        nombre: 'Carlos',
        apellido: 'Repartidor',
        role: 'delivery',
        telefono: '809-555-0200',
      },
    });

    await payload.create({
      collection: 'deliveries',
      data: { user: user.id, status: 'available' },
    });
    console.log('✅ Delivery user created: delivery@middlepoint.do / Delivery123!');
  }

  const clientUser = await payload.find({
    collection: 'users',
    where: { email: { equals: 'cliente@demo.do' } },
    limit: 1,
  });

  if (clientUser.docs.length === 0) {
    await payload.create({
      collection: 'users',
      data: {
        email: 'cliente@demo.do',
        password: 'Cliente123!',
        nombre: 'María',
        apellido: 'García',
        role: 'cliente',
        telefono: '809-555-0300',
      },
    });
    console.log('✅ Demo client created: cliente@demo.do / Cliente123!');
  }

  const client = await payload.find({
    collection: 'users',
    where: { email: { equals: 'cliente@demo.do' } },
    limit: 1,
  });
  const clientId = client.docs[0]?.id;

  if (clientId) {
    const existingReviews = await payload.find({ collection: 'reviews', limit: 1 });
    if (existingReviews.totalDocs === 0) {
      const sampleReviews = [
        {
          user: clientId,
          author_name: 'María García',
          rating: 5,
          comment: 'Los bowls son increíbles, frescos y llegan puntual. Mi favorito de Santo Domingo.',
          approved: true,
        },
        {
          user: clientId,
          author_name: 'María García',
          rating: 4,
          comment: 'Excelente calidad y empaque. El smoothie verde tiene un sabor natural perfecto.',
          approved: true,
        },
      ];
      for (const review of sampleReviews) {
        await payload.create({ collection: 'reviews', data: review, overrideAccess: true });
      }
      console.log('✅ Sample reviews created');
    }
  }

  console.log('🎉 Seed completed successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
