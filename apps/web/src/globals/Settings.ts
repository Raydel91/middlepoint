import type { GlobalConfig } from 'payload';
import { isAdminRole } from '@middlepoint/shared';

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Configuración técnica',
  admin: {
    group: 'Sistema',
    description: 'Tasa de cambio, métricas internas y datos del sistema. Los textos de la tienda están en «Mensajes de la tienda» (Globals → Contenido).',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => isAdminRole(user?.role),
  },
  fields: [
    {
      name: 'exchange_rate_usd',
      type: 'number',
      required: true,
      defaultValue: 58.5,
      min: 0,
      admin: {
        description: 'Tasa de cambio USD → DOP',
      },
    },
    {
      name: 'brand_name',
      type: 'text',
      defaultValue: 'MiddlePoint',
    },
    {
      name: 'marketing_spend',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Gasto de marketing acumulado (para CAC)',
      },
    },
    {
      name: 'site_visits',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
  ],
};
