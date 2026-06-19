import type { Payload } from 'payload';
import type { Locale, OrderStatus, TrackingEvent } from '@middlepoint/shared';
import { MEDIA_DEPTH, PRODUCT_CARD_SELECT, CATEGORY_CARD_SELECT } from '@/lib/query-select';
import { normalizeRouteSlug } from '@/lib/slug';

export class ProductService {
  constructor(private payload: Payload) {}

  async getFeatured(limit = 8) {
    const result = await this.payload.find({
      collection: 'products',
      where: { and: [{ featured: { equals: true } }, { activo: { equals: true } }] },
      limit,
      sort: '-sales_count',
      depth: MEDIA_DEPTH,
      select: PRODUCT_CARD_SELECT,
    });
    return result.docs;
  }

  async getBestSellers(limit = 8) {
    const result = await this.payload.find({
      collection: 'products',
      where: { activo: { equals: true } },
      limit,
      sort: '-sales_count',
      depth: MEDIA_DEPTH,
      select: PRODUCT_CARD_SELECT,
    });
    return result.docs;
  }

  async getCombos(limit = 8) {
    const result = await this.payload.find({
      collection: 'products',
      where: {
        and: [
          { activo: { equals: true } },
          { 'atributos.isCombo': { equals: true } },
        ],
      },
      limit,
      sort: '-sales_count',
      depth: MEDIA_DEPTH,
      select: PRODUCT_CARD_SELECT,
    });
    return result.docs;
  }

  async getBySlug(slug: string) {
    const normalizedSlug = normalizeRouteSlug(slug);
    const result = await this.payload.find({
      collection: 'products',
      where: { slug: { equals: normalizedSlug } },
      limit: 1,
      depth: MEDIA_DEPTH,
    });
    return result.docs[0] ?? null;
  }

  async incrementViewCount(productId: string | number) {
    const product = await this.payload.findByID({
      collection: 'products',
      id: productId,
    });
    await this.payload.update({
      collection: 'products',
      id: productId,
      data: { view_count: (product.view_count || 0) + 1 },
    });
  }

  async getRelated(productId: string | number, categoryId: string | number, limit = 4) {
    const result = await this.payload.find({
      collection: 'products',
      where: {
        and: [
          { activo: { equals: true } },
          { categoria: { equals: categoryId } },
          { id: { not_equals: productId } },
        ],
      },
      limit,
      sort: '-sales_count',
      depth: MEDIA_DEPTH,
      select: PRODUCT_CARD_SELECT,
    });
    return result.docs;
  }

  async getCategories(_locale: Locale = 'es') {
    const result = await this.payload.find({
      collection: 'categories',
      sort: 'orden',
      limit: 100,
      depth: MEDIA_DEPTH,
      select: CATEGORY_CARD_SELECT,
    });
    return result.docs;
  }
}

export class RecommendationService {
  constructor(private payload: Payload) {}

  async getRecommendations(userId?: string | number, limit = 8) {
    if (!userId) {
      return this.getFallback(limit);
    }

    const [purchases, views] = await Promise.all([
      this.payload.find({
        collection: 'order-items',
        where: { 'order.user': { equals: userId } },
        depth: 2,
        limit: 100,
      }),
      this.payload.find({
        collection: 'tracking-events',
        where: {
          and: [
            { user: { equals: userId } },
            { event: { equals: 'view_product' } },
          ],
        },
        limit: 100,
      }),
    ]);

    const scores = new Map<string, number>();

    for (const item of purchases.docs) {
      const productId = typeof item.product === 'object' ? String(item.product?.id) : String(item.product);
      if (productId) {
        scores.set(productId, (scores.get(productId) || 0) + 3 * (item.quantity || 1));
      }
    }

    for (const event of views.docs) {
      const productId = typeof event.product === 'object' ? String(event.product?.id) : String(event.product);
      if (productId) {
        scores.set(productId, (scores.get(productId) || 0) + 1);
      }
    }

    if (scores.size === 0) {
      return this.getFallback(limit);
    }

    const sortedIds = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    const products = await this.payload.find({
      collection: 'products',
      where: {
        and: [
          { id: { in: sortedIds } },
          { activo: { equals: true } },
        ],
      },
      limit,
      depth: MEDIA_DEPTH,
      select: PRODUCT_CARD_SELECT,
    });

    return products.docs.sort(
      (a, b) => sortedIds.indexOf(String(a.id)) - sortedIds.indexOf(String(b.id)),
    );
  }

  async getFallback(limit = 8) {
    const result = await this.payload.find({
      collection: 'products',
      where: { activo: { equals: true } },
      limit,
      sort: '-sales_count',
      depth: MEDIA_DEPTH,
      select: PRODUCT_CARD_SELECT,
    });
    return result.docs;
  }
}

export class OrderService {
  constructor(private payload: Payload) {}

  async createOrder(data: {
    userId?: string | number;
    items: Array<{ productId: string | number; quantity: number; price: number }>;
    total: number;
    paymentMethod: 'cash' | 'transfer';
    address: Record<string, unknown>;
    contactPrimary: Record<string, unknown>;
    contactSecondary?: Record<string, unknown>;
    scheduledDate?: string;
    scheduledTime?: string;
    currency?: 'DOP' | 'USD';
    exchangeRate?: number;
  }) {
    const order = await this.payload.create({
      collection: 'orders',
      data: {
        user: data.userId ? Number(data.userId) : undefined,
        total: data.total,
        status: 'pending',
        payment_method: data.paymentMethod,
        address: data.address,
        contact_primary: data.contactPrimary,
        contact_secondary: data.contactSecondary,
        scheduled_date: data.scheduledDate,
        scheduled_time: data.scheduledTime,
        currency: data.currency || 'DOP',
        exchange_rate_snapshot: data.exchangeRate,
      },
      overrideAccess: true,
    });

    await Promise.all(
      data.items.map((item) =>
        this.payload.create({
          collection: 'order-items',
          data: {
            order: order.id,
            product: Number(item.productId),
            quantity: item.quantity,
            price: item.price,
          },
          overrideAccess: true,
        }),
      ),
    );

    for (const item of data.items) {
      const productId = Number(item.productId);
      const product = await this.payload.findByID({
        collection: 'products',
        id: productId,
        overrideAccess: true,
      });
      await this.payload.update({
        collection: 'products',
        id: productId,
        data: { sales_count: (product.sales_count || 0) + item.quantity },
        overrideAccess: true,
      });
    }

    return order;
  }

  async updateStatus(orderId: string | number, status: OrderStatus) {
    return this.payload.update({
      collection: 'orders',
      id: orderId,
      data: { status },
    });
  }

  async getByUser(userId: string | number) {
    const result = await this.payload.find({
      collection: 'orders',
      where: { user: { equals: userId } },
      sort: '-createdAt',
      depth: 2,
    });
    return result.docs;
  }

  async getById(orderId: string | number) {
    return this.payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 2,
    });
  }
}

export class DeliveryService {
  constructor(private payload: Payload) {}

  async assignDelivery(orderId: string | number, deliveryId: string | number) {
    const delivery = await this.payload.findByID({
      collection: 'deliveries',
      id: deliveryId,
    });

    await this.payload.update({
      collection: 'orders',
      id: orderId,
      data: { delivery: deliveryId, status: 'in_transit' },
    });

    return this.payload.update({
      collection: 'deliveries',
      id: deliveryId,
      data: {
        status: 'busy',
        current_order: orderId,
      },
    });
  }

  async updateStatus(deliveryId: string | number, status: 'available' | 'busy' | 'offline') {
    return this.payload.update({
      collection: 'deliveries',
      id: deliveryId,
      data: { status },
    });
  }

  async completeDelivery(deliveryId: string | number, orderId: string | number) {
    const delivery = await this.payload.findByID({
      collection: 'deliveries',
      id: deliveryId,
    });

    const history = Array.isArray(delivery.delivery_history) ? [...delivery.delivery_history] : [];
    history.push({
      order: orderId,
      delivered_at: new Date().toISOString(),
    });

    await this.payload.update({
      collection: 'orders',
      id: orderId,
      data: { status: 'delivered' },
    });

    return this.payload.update({
      collection: 'deliveries',
      id: deliveryId,
      data: {
        status: 'available',
        current_order: null,
        delivery_history: history,
      },
    });
  }

  async getAvailable() {
    const result = await this.payload.find({
      collection: 'deliveries',
      where: { status: { equals: 'available' } },
      depth: 2,
    });
    return result.docs;
  }

  async getByUser(userId: string | number) {
    const result = await this.payload.find({
      collection: 'deliveries',
      where: { user: { equals: userId } },
      limit: 1,
    });
    return result.docs[0] ?? null;
  }
}

export class AnalyticsService {
  constructor(private payload: Payload) {}

  async getKPIs() {
    const settings = await this.payload.findGlobal({ slug: 'settings' });

    const [orders, clients, trackingEvents] = await Promise.all([
      this.payload.find({
        collection: 'orders',
        where: { status: { not_equals: 'cancelled' } },
        limit: 10000,
      }),
      this.payload.find({
        collection: 'users',
        where: { role: { equals: 'cliente' } },
        limit: 10000,
      }),
      this.payload.find({
        collection: 'tracking-events',
        where: { event: { equals: 'view_product' } },
        limit: 1,
      }),
    ]);

    const totalOrders = orders.totalDocs;
    const totalSales = orders.docs.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
    const totalClients = clients.totalDocs;
    const purchaseFrequency = totalClients > 0 ? totalOrders / totalClients : 0;
    const retentionTime = 12;
    const ltv = avgTicket * purchaseFrequency * retentionTime;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newClients = clients.docs.filter(
      (c) => new Date(c.createdAt) >= thirtyDaysAgo,
    ).length;

    const visits = settings.site_visits || trackingEvents.totalDocs || 1;
    const conversionRate = visits > 0 ? totalOrders / visits : 0;
    const marketingSpend = settings.marketing_spend || 0;
    const cac = newClients > 0 ? marketingSpend / newClients : null;

    return {
      totalSales,
      totalOrders,
      avgTicket,
      conversionRate,
      ltv,
      purchaseFrequency,
      totalClients,
      newClients,
      cac,
      marketingSpend,
    };
  }

  async trackEvent(data: {
    event: TrackingEvent;
    userId?: string | number;
    productId?: string | number;
    sessionId?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.payload.create({
      collection: 'tracking-events',
      data: {
        event: data.event,
        user: data.userId,
        product: data.productId,
        session_id: data.sessionId,
        metadata: data.metadata,
      },
    });
  }

  async incrementSiteVisits() {
    const settings = await this.payload.findGlobal({ slug: 'settings' });
    await this.payload.updateGlobal({
      slug: 'settings',
      data: { site_visits: (settings.site_visits || 0) + 1 },
    });
  }
}

export function createServices(payload: Payload) {
  return {
    product: new ProductService(payload),
    recommendation: new RecommendationService(payload),
    order: new OrderService(payload),
    delivery: new DeliveryService(payload),
    analytics: new AnalyticsService(payload),
  };
}

export type Services = ReturnType<typeof createServices>;
