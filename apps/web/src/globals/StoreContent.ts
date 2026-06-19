import type { GlobalConfig } from 'payload';

import { isStaffRole } from '@middlepoint/shared';



const i18nText = (name: string, label: string, required = true) => ({

  name,

  type: 'group' as const,

  label,

  fields: [

    { name: 'es', type: 'text' as const, required, label: 'Español' },

    { name: 'en', type: 'text' as const, required, label: 'English' },

  ],

});



const i18nTextarea = (name: string, label: string, required = true) => ({

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



export const StoreContent: GlobalConfig = {

  slug: 'store-content',

  label: 'Mensajes de la tienda',

  admin: {

    group: 'Contenido',

    description:

      'Textos visibles en la tienda: inicio, contacto, footer, páginas legales, FAQ y sobre nosotros. (Menú lateral → Globals → Contenido)',

  },

  access: {

    read: () => true,

    update: ({ req: { user } }) => isStaffRole(user?.role),

  },

  fields: [

    {

      name: 'home',

      type: 'group',

      label: 'Página de inicio',

      fields: [

        i18nText('hero_title', 'Título del hero'),

        i18nText('hero_subtitle', 'Subtítulo del hero'),

        i18nText('shop_now', 'Texto botón comprar'),

        i18nText('reviews_title', 'Título sección reseñas'),

        i18nText('reviews_subtitle', 'Subtítulo sección reseñas'),

        {
          name: 'google_reviews_url',
          type: 'text',
          label: 'Enlace para reseñar en Google',
          admin: {
            description:
              'URL de tu ficha de Google (ej. https://g.page/r/.../review). Si está vacío no se muestra el botón.',
          },
        },

        i18nText('google_reviews_label', 'Texto botón reseña en Google', false),

      ],

    },

    {

      name: 'about',

      type: 'group',

      label: 'Sobre nosotros',

      fields: [

        i18nText('title', 'Título de la página'),

        i18nTextarea('content', 'Contenido'),

      ],

    },

    {

      name: 'faq',

      type: 'group',

      label: 'Preguntas frecuentes (FAQ)',

      fields: [

        i18nText('title', 'Título de la página'),

        {

          name: 'items',

          type: 'array',

          label: 'Preguntas y respuestas',

          admin: { initCollapsed: false },

          fields: [

            i18nText('question', 'Pregunta'),

            i18nTextarea('answer', 'Respuesta'),

          ],

        },

      ],

    },

    {

      name: 'legal',

      type: 'group',

      label: 'Páginas legales',

      fields: [

        legalPageFields('terminos', 'Términos y condiciones'),

        legalPageFields('privacidad', 'Política de privacidad'),

        legalPageFields('devoluciones', 'Política de devoluciones'),

      ],

    },

    {

      name: 'footer',

      type: 'group',

      label: 'Footer',

      fields: [

        i18nText('tagline', 'Frase de marca'),

        {

          name: 'copyright_name',

          type: 'text',

          label: 'Nombre en copyright',

          defaultValue: 'Middle Point',

        },

        i18nText('rights', 'Texto derechos reservados'),

        i18nText('developed_by', 'Texto "Desarrollado por"'),

        {

          name: 'developer_name',

          type: 'text',

          label: 'Nombre del desarrollador',

          defaultValue: 'R&M Automatic Solutions',

        },

        {

          name: 'developer_url',

          type: 'text',

          label: 'URL del desarrollador',

          defaultValue: 'https://rymautomaticsolutions.com',

        },

        {

          name: 'rnc',

          type: 'text',

          label: 'RNC',

          defaultValue: 'RNC: 1-31-00000-0',

        },

      ],

    },

    {

      name: 'nav',

      type: 'group',

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

        i18nText('instagram_heading', 'Título Instagram'),

      ],

    },

    {

      name: 'contact',

      type: 'group',

      label: 'Contacto y localización',

      fields: [

        {

          name: 'email',

          type: 'email',

          label: 'Email',

          defaultValue: 'hello@tupuntomedio.com',

        },

        {

          name: 'phone',

          type: 'text',

          label: 'Teléfono (visible)',

          defaultValue: '+1 (809) 123-4567',

        },

        {

          name: 'phone_digits',

          type: 'text',

          label: 'Teléfono (solo dígitos, para enlace)',

          defaultValue: '18091234567',

          admin: { description: 'Ej: 18091234567 para tel:+18091234567' },

        },

        {

          name: 'whatsapp_digits',

          type: 'text',

          label: 'WhatsApp (solo dígitos)',

          defaultValue: '18299876543',

          admin: { description: 'Ej: 18299876543 para wa.me/18299876543' },

        },

        {

          name: 'whatsapp_display',

          type: 'text',

          label: 'WhatsApp (visible)',

          defaultValue: '+1 (829) 987-6543',

        },

        i18nText('address', 'Localización / Dirección'),

        i18nText('whatsapp_message', 'Mensaje prellenado WhatsApp', false),

      ],

    },

    {

      name: 'payment',

      type: 'group',

      label: 'Pagos por transferencia',

      admin: {

        description:

          'Datos bancarios que verá el cliente al elegir transferencia en el checkout.',

      },

      fields: [

        {

          name: 'holder_name',

          type: 'text',

          label: 'Titular de la cuenta',

          defaultValue: 'Middle Point SRL',

        },

        {

          name: 'bank_name',

          type: 'text',

          label: 'Banco',

          defaultValue: 'Banco Popular Dominicano',

        },

        {

          name: 'account_number',

          type: 'text',

          label: 'Número de cuenta',

          admin: {

            description: 'Obligatorio para mostrar los datos al cliente en transferencias.',

          },

        },

        {

          name: 'account_type',

          type: 'select',

          label: 'Tipo de cuenta',

          defaultValue: 'corriente',

          options: [

            { label: 'Cuenta corriente', value: 'corriente' },

            { label: 'Cuenta de ahorros', value: 'ahorros' },

          ],

        },

        {

          name: 'rnc',

          type: 'text',

          label: 'RNC',

          admin: { description: 'RNC de la empresa o titular.' },

        },

        {

          name: 'document_id',

          type: 'text',

          label: 'Cédula del titular (opcional)',

        },

        i18nTextarea(

          'transfer_instructions',

          'Instrucciones adicionales para el cliente',

          false,

        ),

      ],

    },

    {

      name: 'instagram',

      type: 'group',

      label: 'Instagram por categoría',

      fields: [

        {

          name: 'vita_green',

          type: 'group',

          label: 'Vita Green',

          fields: [

            { name: 'label', type: 'text', defaultValue: 'Vita Green' },

            { name: 'url', type: 'text', defaultValue: 'https://instagram.com/tupuntomedio.vitagreen' },

          ],

        },

        {

          name: 'sweet_nice',

          type: 'group',

          label: 'Sweet Nice',

          fields: [

            { name: 'label', type: 'text', defaultValue: 'Sweet Nice' },

            { name: 'url', type: 'text', defaultValue: 'https://instagram.com/tupuntomedio.sweetnice' },

          ],

        },

        {

          name: 'fit_meals',

          type: 'group',

          label: 'Fit Meals',

          fields: [

            { name: 'label', type: 'text', defaultValue: 'Fit Meals' },

            { name: 'url', type: 'text', defaultValue: 'https://instagram.com/tupuntomedio.fitmeals' },

          ],

        },

      ],

    },

  ],

};


