import type { ServerProps } from 'payload';
import { canAccess, formatCurrency, type AnalyticsKPIs } from '@middlepoint/shared';
import { createServices } from '@/services';

type KpiCard = {
  label: string;
  value: string;
  description: string;
  highlight?: boolean;
};

const KPI_BUILDERS = {
  totalSales: (k: AnalyticsKPIs) => formatCurrency(k.totalSales, 'DOP'),
  totalOrders: (k: AnalyticsKPIs) => String(k.totalOrders),
  avgTicket: (k: AnalyticsKPIs) => formatCurrency(k.avgTicket, 'DOP'),
  conversionRate: (k: AnalyticsKPIs) => `${(k.conversionRate * 100).toFixed(1)}%`,
  ltv: (k: AnalyticsKPIs) => formatCurrency(k.ltv, 'DOP'),
  purchaseFrequency: (k: AnalyticsKPIs) => k.purchaseFrequency.toFixed(2),
  totalClients: (k: AnalyticsKPIs) => String(k.totalClients),
  newClients: (k: AnalyticsKPIs) => String(k.newClients),
  cac: (k: AnalyticsKPIs) => (k.cac != null ? formatCurrency(k.cac, 'DOP') : 'N/A'),
};

type KpiKey = keyof typeof KPI_BUILDERS;

const KPI_DEFINITIONS: Array<{
  key: KpiKey;
  label: string;
  description: string;
  highlight?: boolean;
}> = [
  {
    key: 'totalSales',
    label: 'Ventas totales',
    description: 'Suma de ingresos de todos los pedidos, excluyendo los cancelados.',
    highlight: true,
  },
  {
    key: 'totalOrders',
    label: 'Pedidos',
    description: 'Cantidad total de órdenes registradas en la tienda.',
  },
  {
    key: 'avgTicket',
    label: 'Ticket promedio',
    description: 'Monto promedio que gasta un cliente en cada pedido (ventas ÷ pedidos).',
  },
  {
    key: 'conversionRate',
    label: 'Tasa de conversión',
    description: 'Porcentaje de visitas a la tienda que terminan en una compra.',
  },
  {
    key: 'ltv',
    label: 'LTV',
    description: 'Valor de vida del cliente: ingreso estimado que genera un cliente a lo largo del tiempo.',
  },
  {
    key: 'purchaseFrequency',
    label: 'Frecuencia de compra',
    description: 'Promedio de pedidos que realiza cada cliente registrado.',
  },
  {
    key: 'totalClients',
    label: 'Clientes',
    description: 'Total de usuarios registrados con rol de cliente en la plataforma.',
  },
  {
    key: 'newClients',
    label: 'Clientes nuevos (30d)',
    description: 'Clientes que se registraron durante los últimos 30 días.',
  },
  {
    key: 'cac',
    label: 'CAC',
    description: 'Costo de adquisición: gasto de marketing dividido entre clientes nuevos del periodo.',
  },
];

export default async function BeforeDashboard({ payload, user }: ServerProps) {
  let cards: KpiCard[] = [];

  if (user?.role && canAccess(user.role, 'analytics', 'read')) {
    const services = createServices(payload);
    const kpis = await services.analytics.getKPIs();

    cards = KPI_DEFINITIONS.map(({ key, label, description, highlight }) => ({
      label,
      description,
      value: KPI_BUILDERS[key](kpis),
      highlight,
    }));
  }

  return (
    <div className="mp-admin-dashboard">
      <div className="mp-dashboard-welcome">
        <div className="mp-dashboard-welcome__content">
          <p className="mp-dashboard-welcome__eyebrow">Panel de administración</p>
          <h2 className="mp-dashboard-welcome__title">Bienvenido a Middle Point</h2>
          <p className="mp-dashboard-welcome__text">
            Gestiona productos, pedidos, entregas y configuración de Tu Punto Medio desde un solo
            lugar.
          </p>
        </div>
        <div className="mp-dashboard-welcome__actions">
          <a
            href="/es"
            target="_blank"
            rel="noopener noreferrer"
            className="mp-dashboard-welcome__link"
          >
            Ver tienda →
          </a>
          {user?.role &&
          (user.role === 'super_admin' || user.role === 'marketing') ? (
            <a href="/admin/globals/store-content" className="mp-dashboard-welcome__link">
              Mensajes de la tienda →
            </a>
          ) : null}
        </div>
      </div>

      {cards.length > 0 ? (
        <section className="mp-kpi-widget">
          <div className="mp-kpi-widget__header">
            <h2 className="mp-kpi-widget__title">Indicadores clave</h2>
            <p className="mp-kpi-widget__subtitle">Resumen de ventas y clientes</p>
          </div>
          <div className="mp-kpi-widget__grid">
            {cards.map((card) => (
              <article
                key={card.label}
                className={`mp-kpi-card${card.highlight ? ' mp-kpi-card--highlight' : ''}`}
              >
                <span className="mp-kpi-card__label">{card.label}</span>
                <span className="mp-kpi-card__value">{card.value}</span>
                <p className="mp-kpi-card__description">{card.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
