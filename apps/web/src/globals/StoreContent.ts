import type { GlobalConfig } from 'payload';

import { isAdminNavHidden, isAdminRole, isMarketingRole } from '@middlepoint/shared';

// Los textos de la tienda no son obligatorios a nivel de formulario: el
// resolver (store-content.ts) provee valores por defecto para todo. Así, dejar
// un campo vacío en cualquier pestaña nunca bloquea el guardado completo del
// global (que era la causa de "los cambios se pierden").
const i18nText = (name: string, label: string, required = false) => ({
  name,
  type: 'group' as const,
  label,
  fields: [
    { name: 'es', type: 'text' as const, required, label: 'Español' },
    { name: 'en', type: 'text' as const, required, label: 'English' },
  ],
});

const i18nTextarea = (name: string, label: string, required = false) => ({
  name,
  type: 'group' as const,
  label,
  fields: [
    {
      name: 'es',
      type: 'textarea' as const,
      required,
      label: 'Español',
      admin: { rows: 8 },
    },
    {
      name: 'en',
      type: 'textarea' as const,
      required,
      label: 'English',
      admin: { rows: 8 },
    },
  ],
});

const legalPageFields = (name: string, label: string) => ({
  name,
  type: 'group' as const,
  label,
  fields: [
    i18nText('title', 'Título'),
    i18nText('updated', 'Última actualización', false),
    i18nTextarea('content', 'Contenido'),
  ],
});

const homeGroup = {
  name: 'home',
  type: 'group' as const,
  label: 'Página de inicio',
  fields: [
    i18nText('hero_title', 'Título del hero'),
    i18nText('hero_subtitle', 'Subtítulo del hero'),
    i18nText('shop_now', 'Texto botón comprar'),
    i18nText('reviews_title', 'Título sección reseñas'),
    i18nText('reviews_subtitle', 'Subtítulo sección reseñas'),
    {
      name: 'google_reviews_url',
      type: 'text' as const,
      label: 'Enlace para reseñar en Google',
      admin: {
        description:
          'URL de tu ficha de Google (ej. https://g.page/r/.../review). Si está vacío no se muestra el botón.',
      },
    },
    i18nText('google_reviews_label', 'Texto botón reseña en Google', false),
  ],
};

const aboutGroup = {
  name: 'about',
  type: 'group' as const,
  label: 'Sobre nosotros',
  fields: [i18nText('title', 'Título de la página'), i18nTextarea('content', 'Contenido')],
};

const faqGroup = {
  name: 'faq',
  type: 'group' as const,
  label: 'Preguntas frecuentes (FAQ)',
  fields: [
    i18nText('title', 'Título de la página'),
    {
      name: 'items',
      type: 'array' as const,
      label: 'Preguntas y respuestas',
      admin: { initCollapsed: false },
      fields: [i18nText('question', 'Pregunta'), i18nTextarea('answer', 'Respuesta')],
    },
  ],
};

const legalGroup = {
  name: 'legal',
  type: 'group' as const,
  label: 'Páginas legales',
  fields: [
    legalPageFields('terminos', 'Términos y condiciones'),
    legalPageFields('privacidad', 'Política de privacidad'),
    legalPageFields('devoluciones', 'Política de devoluciones'),
  ],
};

const footerGroup = {
  name: 'footer',
  type: 'group' as const,
  label: 'Footer',
  fields: [
    i18nText('tagline', 'Frase de marca'),
    {
      name: 'copyright_name',
      type: 'text' as const,
      label: 'Nombre en copyright',
      defaultValue: 'Middle Point',
    },
    i18nText('rights', 'Texto derechos reservados'),
    i18nText('developed_by', 'Texto "Desarrollado por"'),
    {
      name: 'developer_name',
      type: 'text' as const,
      label: 'Nombre del desarrollador',
      defaultValue: 'R&M Automatic Solutions',
    },
    {
      name: 'developer_url',
      type: 'text' as const,
      label: 'URL del desarrollador',
      defaultValue: 'https://rymautomaticsolutions.com',
    },
    {
      name: 'rnc',
      type: 'text' as const,
      label: 'RNC',
      defaultValue: 'RNC: 1-31-00000-0',
    },
  ],
};

const navGroup = {
  name: 'nav',
  type: 'group' as const,
  label: 'Enlaces del menú y footer',
  fields: [
    i18nText('home', 'Inicio'),
    i18nText('shop', 'Tienda / Shop'),
    i18nText('categories', 'Categorías'),
    i18nText('account', 'Cuenta'),
    i18nText('about', 'Sobre nosotros'),
    i18nText('faq', 'FAQ'),
    i18nText('terms', 'Términos y condiciones'),
    i18nText('privacy', 'Política de privacidad'),
    i18nText('returns', 'Política de devoluciones'),
    i18nText('contact_heading', 'Título columna contacto'),
    i18nText('quick_nav_heading', 'Título navegación rápida'),
    i18nText('legal_heading', 'Título columna legal'),
    i18nText('instagram_heading', 'Título Instagram (footer)'),
  ],
};

const contactGroup = {
  name: 'contact',
  type: 'group' as const,
  label: 'Contacto y localización',
  fields: [
    {
      name: 'email',
      type: 'email' as const,
      label: 'Email',
      defaultValue: 'hello@tupuntomedio.com',
    },
    {
      name: 'phone',
      type: 'text' as const,
      label: 'Teléfono (visible)',
      defaultValue: '+1 (809) 123-4567',
    },
    {
      name: 'phone_digits',
      type: 'text' as const,
      label: 'Teléfono (solo dígitos, para enlace)',
      defaultValue: '18091234567',
      admin: { description: 'Ej: 18091234567 para tel:+18091234567' },
    },
    {
      name: 'whatsapp_digits',
      type: 'text' as const,
      label: 'WhatsApp (solo dígitos)',
      defaultValue: '18299876543',
      admin: { description: 'Ej: 18299876543 para wa.me/18299876543' },
    },
    {
      name: 'whatsapp_display',
      type: 'text' as const,
      label: 'WhatsApp (visible)',
      defaultValue: '+1 (829) 987-6543',
    },
    {
      name: 'order_confirmation_whatsapp',
      type: 'text' as const,
      label: 'WhatsApp de confirmación de pedidos (solo dígitos)',
      defaultValue: '18299876543',
      admin: {
        description:
          'Número al que el cliente enviará el comprobante de su pedido tras el checkout. Solo dígitos, ej: 18299876543.',
      },
    },
    i18nText('address', 'Localización / Dirección'),
    i18nText('whatsapp_message', 'Mensaje prellenado WhatsApp', false),
  ],
};

const paymentGroup = {
  name: 'payment',
  type: 'group' as const,
  label: 'Pagos por transferencia',
  admin: {
    description:
      'Cuentas bancarias que verá el cliente al elegir transferencia en el checkout. Puedes añadir varias y el cliente escogerá a cuál pagar.',
  },
  fields: [
    {
      name: 'accounts',
      type: 'array' as const,
      label: 'Cuentas bancarias',
      labels: { singular: 'Cuenta', plural: 'Cuentas' },
      admin: {
        initCollapsed: false,
        description:
          'Cada cuenta se mostrará como una opción de pago. Añade al menos una con número de cuenta.',
      },
      fields: [
        {
          name: 'holder_name',
          type: 'text' as const,
          label: 'Titular de la cuenta',
          defaultValue: 'Middle Point SRL',
        },
        {
          name: 'bank_name',
          type: 'text' as const,
          label: 'Banco',
          defaultValue: 'Banco Popular Dominicano',
        },
        {
          name: 'account_number',
          type: 'text' as const,
          label: 'Número de cuenta',
          admin: {
            description: 'Obligatorio para mostrar la cuenta al cliente.',
          },
        },
        {
          name: 'account_type',
          type: 'select' as const,
          label: 'Tipo de cuenta',
          defaultValue: 'corriente',
          options: [
            { label: 'Cuenta corriente', value: 'corriente' },
            { label: 'Cuenta de ahorros', value: 'ahorros' },
          ],
        },
        {
          name: 'currency',
          type: 'select' as const,
          label: 'Moneda de la cuenta',
          defaultValue: 'DOP',
          options: [
            { label: 'Peso dominicano (DOP)', value: 'DOP' },
            { label: 'Dólar estadounidense (USD)', value: 'USD' },
          ],
        },
        {
          name: 'rnc',
          type: 'text' as const,
          label: 'RNC',
          admin: { description: 'RNC de la empresa o titular.' },
        },
        {
          name: 'document_id',
          type: 'text' as const,
          label: 'Cédula del titular (opcional)',
        },
      ],
    },
    i18nTextarea('transfer_instructions', 'Instrucciones adicionales para el cliente', false),
  ],
};

const businessGroup = {
  name: 'business',
  type: 'group' as const,
  label: 'Business Information',
  admin: {
    description: 'Datos de la empresa para SEO, footer y Schema.org Organization.',
  },
  fields: [
    {
      name: 'name',
      type: 'text' as const,
      label: 'Business Name',
      defaultValue: 'Middle Point',
    },
    {
      name: 'logo',
      type: 'upload' as const,
      relationTo: 'media' as const,
      label: 'Business Logo',
    },
    {
      name: 'email',
      type: 'email' as const,
      label: 'Business Email',
      defaultValue: 'hello@tupuntomedio.com',
    },
    {
      name: 'phone',
      type: 'text' as const,
      label: 'Business Phone',
      defaultValue: '+1 (809) 123-4567',
    },
    {
      name: 'whatsapp',
      type: 'text' as const,
      label: 'WhatsApp',
      defaultValue: '+1 (829) 987-6543',
    },
    i18nText('address', 'Address'),
    {
      name: 'google_maps_url',
      type: 'text' as const,
      label: 'Google Maps URL',
    },
    {
      name: 'instagram_corporate',
      type: 'text' as const,
      label: 'Instagram (Corporativo)',
      defaultValue: 'https://instagram.com/tupuntomedio',
    },
    {
      name: 'instagram_vita_green',
      type: 'text' as const,
      label: 'Instagram Vita Green',
      defaultValue: 'https://instagram.com/tupuntomedio.vitagreen',
    },
    {
      name: 'instagram_sweet_nice',
      type: 'text' as const,
      label: 'Instagram Sweet Nice',
      defaultValue: 'https://instagram.com/tupuntomedio.sweetnice',
    },
    {
      name: 'instagram_fit_meals',
      type: 'text' as const,
      label: 'Instagram Fit Meals',
      defaultValue: 'https://instagram.com/tupuntomedio.fitmeals',
    },
  ],
};

export const StoreContent: GlobalConfig = {
  slug: 'store-content',
  label: 'Mensajes de la tienda',
  admin: {
    group: 'Contenido',
    description:
      'Textos y datos del negocio. Instagram por marca en «Negocio»; cada categoría/producto también puede tener sus redes en Social Media.',
    hidden: ({ user }) => isAdminNavHidden(user?.role, 'store-content'),
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) =>
      isAdminRole(user?.role) || isMarketingRole(user?.role),
  },
  hooks: {
    afterChange: [
      async () => {
        try {
          const { revalidatePath } = await import('next/cache');
          revalidatePath('/', 'layout');
        } catch {
          /* fuera de contexto de request (p. ej. scripts): se ignora */
        }
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        { label: 'Inicio', fields: [homeGroup] },
        { label: 'Sobre nosotros', fields: [aboutGroup] },
        { label: 'FAQ', fields: [faqGroup] },
        { label: 'Legal', fields: [legalGroup] },
        { label: 'Footer', fields: [footerGroup] },
        { label: 'Menú', fields: [navGroup] },
        { label: 'Contacto', fields: [contactGroup] },
        { label: 'Pagos', fields: [paymentGroup] },
        { label: 'Negocio', fields: [businessGroup] },
      ],
    },
  ],
};
