import type { CollectionConfig } from 'payload';
import {
  isDeliveryRole,
  isOperadorRole,
  isAdminRole,
  canAccessAdminNav,
  isAdminNavHidden,
  DELIVERY_ASSIGNABLE_ROLES,
} from '@middlepoint/shared';
import type { OrderStatus } from '@middlepoint/shared';
import { notifyOrderStatusChange } from '@/lib/order-notifications';
import { notifyOrderRescheduled } from '@/lib/order-reschedule-notification';
import { buildDeliveryOrdersWhere } from '@/lib/delivery-access';
import {
  DELIVERY_REQUIRED_FOR_TRANSIT_MESSAGE,
  hasDeliveryAssigned,
  statusRequiresDelivery,
} from '@/lib/order-status-workflow';

const clientOnlyUpdate = {
  update: () => false,
  create: () => true,
};

const officeOnlyUpdate = {
  update: ({ req: { user } }: { req: { user?: { role?: string } | null } }) =>
    isAdminRole(user?.role as never) || isOperadorRole(user?.role as never),
  create: () => true,
};

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Pedido', plural: 'Pedidos' },
  defaultSort: '-scheduled_date',
  admin: {
    useAsTitle: 'id',
    defaultColumns: [
      'id',
      'status',
      'delivery',
      'scheduled_date',
      'total',
      'payment_method',
      'orderActions',
    ],
    group: 'Ventas',
    hidden: ({ user }) =>
      !isDeliveryRole(user?.role) && isAdminNavHidden(user?.role, 'orders'),
    components: {
      beforeListTable: ['@/components/payload/OrdersStatusTabs#OrdersStatusTabs'],
    },
  },
  access: {
    admin: ({ req: { user } }) =>
      isDeliveryRole(user?.role) || canAccessAdminNav(user?.role, 'orders'),
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (isDeliveryRole(user.role)) {
        return buildDeliveryOrdersWhere(user.id);
      }
      if (canAccessAdminNav(user.role, 'orders')) return true;
      return { user: { equals: user.id } };
    },
    create: () => true,
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (isDeliveryRole(user.role)) {
        return buildDeliveryOrdersWhere(user.id);
      }
      return canAccessAdminNav(user.role, 'orders');
    },
    delete: ({ req: { user } }) => user?.role === 'super_admin',
  },
  fields: [
    {
      name: 'orderDetailsCard',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/payload/OrderDetailsCardField#OrderDetailsCardField',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      // Delivery no edita el select a mano: solo vía acciones (API).
      access: officeOnlyUpdate,
      options: [
        { label: 'Pendiente', value: 'pending' },
        { label: 'Confirmado', value: 'confirmed' },
        { label: 'Preparando', value: 'preparing' },
        { label: 'Listo', value: 'ready' },
        { label: 'En tránsito', value: 'in_transit' },
        { label: 'Entregado', value: 'delivered' },
        { label: 'Devuelto', value: 'returned' },
        { label: 'Cancelado', value: 'cancelled' },
      ],
    },
    {
      name: 'delivery',
      type: 'relationship',
      relationTo: 'users',
      label: 'Repartidor / entrega',
      filterOptions: {
        role: {
          in: [...DELIVERY_ASSIGNABLE_ROLES],
        },
      },
      access: officeOnlyUpdate,
      admin: {
        description: 'Usuarios con rol delivery, operador o super admin.',
        condition: (_, __, { user }) => !isDeliveryRole(user?.role),
        components: {
          Cell: '@/components/payload/OrderDeliveryCell#OrderDeliveryCell',
        },
      },
    },
    {
      name: 'orderSchedule',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/payload/OrderScheduleField#OrderScheduleField',
        },
        condition: (_, __, { user }) => !isDeliveryRole(user?.role),
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      access: clientOnlyUpdate,
      admin: { hidden: true },
    },
    {
      name: 'total',
      type: 'number',
      required: true,
      min: 0,
      access: clientOnlyUpdate,
      admin: {
        hidden: true,
        components: {
          Cell: '@/components/payload/OrderTotalCell#OrderTotalCell',
        },
      },
    },
    {
      name: 'payment_method',
      type: 'select',
      required: true,
      access: clientOnlyUpdate,
      options: [
        { label: 'Efectivo', value: 'cash' },
        { label: 'Transferencia', value: 'transfer' },
      ],
      admin: { hidden: true },
    },
    {
      name: 'payment_account',
      type: 'json',
      label: 'Cuenta de transferencia elegida',
      access: clientOnlyUpdate,
      admin: { hidden: true },
    },
    {
      name: 'address',
      type: 'json',
      required: true,
      access: clientOnlyUpdate,
      admin: { hidden: true },
    },
    {
      name: 'contact_primary',
      type: 'json',
      required: true,
      access: clientOnlyUpdate,
      admin: { hidden: true },
    },
    {
      name: 'contact_secondary',
      type: 'json',
      access: clientOnlyUpdate,
      admin: { hidden: true },
    },
    {
      name: 'scheduled_date',
      type: 'text',
      label: 'Fecha de entrega',
      index: true,
      access: clientOnlyUpdate,
      admin: {
        hidden: true,
        components: {
          Cell: '@/components/payload/OrderScheduleCell#OrderScheduleCell',
        },
      },
    },
    {
      name: 'scheduled_time',
      type: 'text',
      label: 'Hora de entrega',
      access: clientOnlyUpdate,
      admin: { hidden: true },
    },
    {
      name: 'currency',
      type: 'select',
      defaultValue: 'DOP',
      access: clientOnlyUpdate,
      options: [
        { label: 'DOP', value: 'DOP' },
        { label: 'USD', value: 'USD' },
      ],
      admin: { hidden: true },
    },
    {
      name: 'exchange_rate_snapshot',
      type: 'number',
      access: clientOnlyUpdate,
      admin: { hidden: true },
    },
    {
      name: 'customer_locale',
      type: 'select',
      defaultValue: 'es',
      access: { update: () => false, create: () => true },
      options: [
        { label: 'Español', value: 'es' },
        { label: 'English', value: 'en' },
      ],
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Idioma del cliente al realizar el pedido (notificaciones).',
        condition: (_, __, { user }) => !isDeliveryRole(user?.role),
      },
    },
    {
      name: 'cancellation_reason',
      type: 'textarea',
      label: 'Motivo de cancelación',
      access: { update: () => false, create: () => false },
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data, _, { user }) =>
          data?.status === 'cancelled' && !isDeliveryRole(user?.role),
      },
    },
    {
      name: 'orderActions',
      type: 'ui',
      label: 'Acciones',
      admin: {
        components: {
          Cell: '@/components/payload/OrderActionsCell#OrderActionsCell',
          Field: '@/components/payload/OrderActionsField#OrderActionsField',
        },
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      ({ data, originalDoc, operation }) => {
        const nextStatus = (data?.status ?? originalDoc?.status) as OrderStatus | undefined;
        const prevStatus =
          operation === 'create' ? undefined : (originalDoc?.status as OrderStatus | undefined);

        if (!statusRequiresDelivery(nextStatus) || prevStatus === 'in_transit') {
          return data;
        }

        const delivery =
          data && Object.prototype.hasOwnProperty.call(data, 'delivery')
            ? data.delivery
            : originalDoc?.delivery;

        if (!hasDeliveryAssigned(delivery)) {
          throw new Error(DELIVERY_REQUIRED_FOR_TRANSIT_MESSAGE);
        }

        return data;
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        const userId =
          typeof doc.user === 'object' && doc.user !== null ? doc.user.id : doc.user;
        if (!userId) return;

        const status = doc.status as OrderStatus;
        const locale = doc.customer_locale === 'en' ? 'en' : 'es';

        if (operation === 'create') {
          try {
            await notifyOrderStatusChange(req.payload, {
              userId,
              orderId: doc.id,
              status,
              locale,
            });
          } catch (err) {
            req.payload.logger.error(
              `Order notification failed for order ${doc.id}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
          return;
        }

        if (operation === 'update' && previousDoc) {
          const scheduleChanged =
            doc.scheduled_date !== previousDoc.scheduled_date ||
            doc.scheduled_time !== previousDoc.scheduled_time;

          if (scheduleChanged) {
            try {
              await notifyOrderRescheduled(req.payload, {
                userId,
                orderId: doc.id,
                locale,
                scheduledDate: doc.scheduled_date as string | null,
                scheduledTime: doc.scheduled_time as string | null,
              });
            } catch (err) {
              req.payload.logger.error(
                `Reschedule notification failed for order ${doc.id}: ${err instanceof Error ? err.message : String(err)}`,
              );
            }
          }

          if (doc.status !== previousDoc.status) {
            try {
              const ctx = req.context as { orderNotification?: { supportMessageId?: number } };
              await notifyOrderStatusChange(req.payload, {
                userId,
                orderId: doc.id,
                status,
                locale,
                supportMessageId: ctx?.orderNotification?.supportMessageId,
              });
            } catch (err) {
              req.payload.logger.error(
                `Order notification failed for order ${doc.id}: ${err instanceof Error ? err.message : String(err)}`,
              );
            }
          }
        }
      },
    ],
  },
};
