import { cache } from 'react';
import type { Locale } from '@middlepoint/shared';
import { getI18nValue } from '@middlepoint/shared';
import { getPayloadClient } from '@/lib/payload';
import { FOOTER_CONFIG } from '@/lib/footer-config';

type I18nGroup = { es?: string | null; en?: string | null };

export type ContentPage = {
  title: string;
  updated: string;
  content: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type BankAccount = {
  holderName: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  accountTypeLabel: string;
  currency: string;
  currencyLabel: string;
  rnc: string;
  documentId: string;
};

export type ResolvedStoreContent = {
  home: {
    heroTitle: string;
    heroSubtitle: string;
    shopNow: string;
    reviewsTitle: string;
    reviewsSubtitle: string;
    googleReviewsUrl: string;
    googleReviewsLabel: string;
  };
  footer: {
    tagline: string;
    copyrightName: string;
    rights: string;
    developedBy: string;
    developerName: string;
    developerUrl: string;
    rnc: string;
  };
  nav: {
    home: string;
    shop: string;
    categories: string;
    account: string;
    about: string;
    faq: string;
    terms: string;
    privacy: string;
    returns: string;
    contactHeading: string;
    quickNavHeading: string;
    legalHeading: string;
    instagramHeading: string;
  };
  contact: {
    email: string;
    phone: string;
    phoneHref: string;
    whatsappDisplay: string;
    whatsappHref: string;
    address: string;
    orderConfirmationWhatsapp: string;
  };
  payment: {
    accounts: BankAccount[];
    instructions: string;
  };
};

const LEGAL_DEFAULTS = {
  terminos: {
    title: { es: 'Términos y condiciones', en: 'Terms & conditions' },
    updated: { es: 'Última actualización: 2026', en: 'Last updated: 2026' },
    content: {
      es: 'Al utilizar Tu Punto Medio aceptas los siguientes términos de servicio.\n\nLos productos están sujetos a disponibilidad. Los precios pueden variar sin previo aviso. El usuario es responsable de proporcionar información de contacto y entrega correcta. Tu Punto Medio se reserva el derecho de cancelar pedidos en casos de fraude o error evidente.',
      en: 'By using Your Middle Point you agree to the following terms of service.\n\nProducts are subject to availability. Prices may change without notice. Users are responsible for providing accurate contact and delivery information. Your Middle Point reserves the right to cancel orders in cases of fraud or obvious error.',
    },
  },
  privacidad: {
    title: { es: 'Política de privacidad', en: 'Privacy policy' },
    updated: { es: 'Última actualización: 2026', en: 'Last updated: 2026' },
    content: {
      es: 'Tu Punto Medio protege tus datos personales conforme a la legislación dominicana.\n\nRecopilamos nombre, email, teléfono y dirección únicamente para procesar pedidos y mejorar tu experiencia. No vendemos ni compartimos tus datos con terceros, excepto proveedores necesarios para entrega y pagos. Puedes solicitar acceso o eliminación de tus datos escribiendo a hello@tupuntomedio.com.',
      en: 'Your Middle Point protects your personal data in accordance with Dominican law.\n\nWe collect name, email, phone and address solely to process orders and improve your experience. We do not sell or share your data with third parties, except providers necessary for delivery and payments. You may request access or deletion of your data at hello@tupuntomedio.com.',
    },
  },
  devoluciones: {
    title: { es: 'Política de devoluciones', en: 'Returns policy' },
    updated: { es: 'Última actualización: 2026', en: 'Last updated: 2026' },
    content: {
      es: 'Queremos que estés satisfecho con cada pedido de Tu Punto Medio.\n\nPor la naturaleza de nuestros productos perecederos, las devoluciones aplican solo si el pedido llega dañado o incorrecto. Debes reportarlo dentro de las 2 horas posteriores a la entrega con foto del producto. Evaluaremos reembolso parcial o reenvío según corresponda.',
      en: 'We want you to be satisfied with every Your Middle Point order.\n\nDue to the perishable nature of our products, returns apply only if the order arrives damaged or incorrect. You must report it within 2 hours of delivery with a photo. We will evaluate partial refund or reshipment as appropriate.',
    },
  },
} as const;

const FAQ_DEFAULTS = {
  title: { es: 'Preguntas frecuentes', en: 'Frequently asked questions' },
  items: [
    {
      question: { es: '¿Cuáles son los métodos de pago?', en: 'What payment methods do you accept?' },
      answer: {
        es: 'Aceptamos efectivo y transferencia bancaria. Próximamente Stripe y PayPal.',
        en: 'We accept cash and bank transfer. Stripe and PayPal coming soon.',
      },
    },
    {
      question: { es: '¿Hacen entregas en todo Santo Domingo?', en: 'Do you deliver throughout Santo Domingo?' },
      answer: {
        es: 'Sí, cubrimos la mayoría de zonas del Gran Santo Domingo. Al checkout puedes programar fecha y hora.',
        en: 'Yes, we cover most areas of Greater Santo Domingo. You can schedule date and time at checkout.',
      },
    },
    {
      question: { es: '¿Puedo modificar mi pedido?', en: 'Can I modify my order?' },
      answer: {
        es: 'Puedes contactarnos por WhatsApp antes de que el pedido entre en preparación.',
        en: 'Contact us via WhatsApp before the order enters preparation.',
      },
    },
    {
      question: { es: '¿Los productos son frescos?', en: 'Are products fresh?' },
      answer: {
        es: 'Todos nuestros bowls, smoothies y snacks se preparan con ingredientes naturales el mismo día de la entrega.',
        en: 'All our bowls, smoothies and snacks are prepared with natural ingredients on the same day of delivery.',
      },
    },
  ],
} as const;

const ABOUT_DEFAULTS = {
  title: { es: 'Sobre nosotros', en: 'About us' },
  content: {
    es: 'Tu Punto Medio nació con la misión de reunir lo mejor del bienestar y el placer en cada producto.\n\nSomos una marca dominicana de wellness: jugos verdes, bowls, smoothies y snacks preparados con ingredientes naturales, pensados para quienes buscan equilibrio sin renunciar al sabor.\n\nCreemos en la transparencia, la frescura y el trato cercano. Cada pedido se prepara con cuidado y se entrega en Santo Domingo para que disfrutes tu punto medio entre lo saludable y lo delicioso.',
    en: 'Your Middle Point was born with the mission to bring together the best of wellness and indulgence in every product.\n\nWe are a Dominican wellness brand: green juices, bowls, smoothies and snacks made with natural ingredients, designed for those who seek balance without giving up flavor.\n\nWe believe in transparency, freshness and a personal touch. Every order is carefully prepared and delivered in Santo Domingo so you can enjoy your middle point between healthy and delicious.',
  },
} as const;

const DEFAULTS = {
  home: {
    hero_title: {
      es: 'Bienestar en equilibrio',
      en: 'Wellness in balance',
    },
    hero_subtitle: {
      es: 'Descubre productos wellness hechos con ingredientes naturales en República Dominicana',
      en: 'Discover wellness products made with natural ingredients in the Dominican Republic',
    },
    shop_now: { es: 'Comprar ahora', en: 'Shop now' },
    reviews_title: { es: 'Lo que dicen nuestros clientes', en: 'What our customers say' },
    reviews_subtitle: {
      es: 'Experiencias reales de quienes ya disfrutan Tu Punto Medio',
      en: 'Real experiences from those who already enjoy Your Middle Point',
    },
    google_reviews_url: '',
    google_reviews_label: {
      es: 'Déjanos tu reseña en Google',
      en: 'Leave us a review on Google',
    },
  },
  about: ABOUT_DEFAULTS,
  faq: FAQ_DEFAULTS,
  legal: LEGAL_DEFAULTS,
  footer: {
    tagline: FOOTER_CONFIG.tagline,
    copyright_name: FOOTER_CONFIG.copyrightName,
    rights: { es: 'Todos los derechos reservados', en: 'All rights reserved' },
    developed_by: { es: 'Desarrollado por', en: 'Developed by' },
    developer_name: FOOTER_CONFIG.developer.name,
    developer_url: FOOTER_CONFIG.developer.url,
    rnc: FOOTER_CONFIG.legal.rnc,
  },
  nav: {
    home: { es: 'Inicio', en: 'Home' },
    shop: { es: 'Productos', en: 'Shop' },
    categories: { es: 'Categorías', en: 'Categories' },
    account: { es: 'Cuenta', en: 'Account' },
    about: { es: 'Sobre nosotros', en: 'About us' },
    faq: { es: 'FAQ', en: 'FAQ' },
    terms: { es: 'Términos y condiciones', en: 'Terms & conditions' },
    privacy: { es: 'Política de privacidad', en: 'Privacy policy' },
    returns: { es: 'Política de devoluciones', en: 'Returns policy' },
    contact_heading: { es: 'Contacto', en: 'Contact' },
    quick_nav_heading: { es: 'Navegación', en: 'Quick links' },
    legal_heading: { es: 'Legal', en: 'Legal' },
    instagram_heading: { es: 'Instagram', en: 'Instagram' },
  },
  contact: {
    email: FOOTER_CONFIG.contact.email,
    phone: FOOTER_CONFIG.contact.phone,
    phone_digits: '18091234567',
    whatsapp_digits: '18299876543',
    whatsapp_display: FOOTER_CONFIG.contact.whatsapp,
    order_confirmation_whatsapp: '18299876543',
    address: FOOTER_CONFIG.contact.address,
    whatsapp_message: {
      es: 'Hola, me gustaría obtener más información sobre Tu Punto Medio',
      en: 'Hi, I would like more information about Your Middle Point',
    },
  },
  payment: {
    accounts: [
      {
        holder_name: 'Middle Point SRL',
        bank_name: 'Banco Popular Dominicano',
        account_number: '',
        account_type: 'corriente',
        currency: 'DOP',
        rnc: '',
        document_id: '',
      },
    ],
    transfer_instructions: {
      es: 'Envía el comprobante por WhatsApp indicando tu número de pedido.',
      en: 'Send the payment receipt via WhatsApp including your order number.',
    },
  },
} as const;

const ACCOUNT_TYPE_LABELS: Record<string, I18nGroup> = {
  corriente: { es: 'Cuenta corriente', en: 'Checking account' },
  ahorros: { es: 'Cuenta de ahorros', en: 'Savings account' },
};

const CURRENCY_LABELS: Record<string, I18nGroup> = {
  DOP: { es: 'Peso dominicano (DOP)', en: 'Dominican peso (DOP)' },
  USD: { es: 'Dólar estadounidense (USD)', en: 'US dollar (USD)' },
};

type RawAccount = Record<string, unknown>;

function resolveBankAccount(acc: RawAccount, locale: Locale): BankAccount {
  const accountType = (acc.account_type as string) || 'corriente';
  const currency = (acc.currency as string) || 'DOP';
  return {
    holderName: (acc.holder_name as string) || '',
    bankName: (acc.bank_name as string) || '',
    accountNumber: (acc.account_number as string) || '',
    accountType,
    accountTypeLabel: pickI18n(
      ACCOUNT_TYPE_LABELS[accountType] ?? ACCOUNT_TYPE_LABELS.corriente,
      locale,
      ACCOUNT_TYPE_LABELS.corriente,
    ),
    currency,
    currencyLabel: pickI18n(
      CURRENCY_LABELS[currency] ?? CURRENCY_LABELS.DOP,
      locale,
      CURRENCY_LABELS.DOP,
    ),
    rnc: (acc.rnc as string) || '',
    documentId: (acc.document_id as string) || '',
  };
}

function resolvePaymentAccounts(
  paymentDoc: Record<string, unknown>,
  locale: Locale,
): BankAccount[] {
  const rawAccounts = Array.isArray(paymentDoc.accounts)
    ? (paymentDoc.accounts as RawAccount[])
    : null;

  let source: RawAccount[];
  if (rawAccounts && rawAccounts.length > 0) {
    source = rawAccounts;
  } else if (paymentDoc.account_number || paymentDoc.holder_name) {
    // Retrocompat: estructura antigua de una sola cuenta plana.
    source = [paymentDoc];
  } else {
    source = DEFAULTS.payment.accounts as unknown as RawAccount[];
  }

  return source.map((acc) => resolveBankAccount(acc, locale));
}

function pickI18n(field: I18nGroup | undefined | null, locale: Locale, fallback: I18nGroup): string {
  return getI18nValue(field ?? fallback, locale) || getI18nValue(fallback, locale);
}

function buildWhatsappHref(digits: string, message?: string): string {
  const base = `https://wa.me/${digits.replace(/\D/g, '')}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

function resolveContentPage(
  page: Record<string, I18nGroup | undefined> | undefined,
  defaults: {
    title: I18nGroup;
    updated: I18nGroup;
    content: I18nGroup;
  },
  locale: Locale,
): ContentPage {
  return {
    title: pickI18n(page?.title, locale, defaults.title),
    updated: pickI18n(page?.updated, locale, defaults.updated),
    content: pickI18n(page?.content, locale, defaults.content),
  };
}

const loadStoreContentDoc = cache(async () => {
  try {
    const payload = await getPayloadClient();
    return (await payload.findGlobal({ slug: 'store-content' })) as unknown as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
});

export const getStoreContent = cache(async (locale: Locale): Promise<ResolvedStoreContent> => {
  const doc = await loadStoreContentDoc();

  const home = (doc?.home ?? {}) as Record<string, string | I18nGroup | undefined>;
  const footer = (doc?.footer ?? {}) as Record<string, string | I18nGroup | undefined>;
  const nav = (doc?.nav ?? {}) as Record<string, I18nGroup | undefined>;
  const contact = (doc?.contact ?? {}) as Record<string, string | I18nGroup | undefined>;
  const payment = (doc?.payment ?? {}) as Record<string, unknown>;

  const whatsappDigits =
    (contact.whatsapp_digits as string) || DEFAULTS.contact.whatsapp_digits;
  const whatsappMessage = pickI18n(
    contact.whatsapp_message as I18nGroup,
    locale,
    DEFAULTS.contact.whatsapp_message,
  );
  const phoneDigits = (contact.phone_digits as string) || DEFAULTS.contact.phone_digits;
  const paymentAccounts = resolvePaymentAccounts(payment, locale);

  return {
    home: {
      heroTitle: pickI18n(home.hero_title as I18nGroup, locale, DEFAULTS.home.hero_title),
      heroSubtitle: pickI18n(home.hero_subtitle as I18nGroup, locale, DEFAULTS.home.hero_subtitle),
      shopNow: pickI18n(home.shop_now as I18nGroup, locale, DEFAULTS.home.shop_now),
      reviewsTitle: pickI18n(home.reviews_title as I18nGroup, locale, DEFAULTS.home.reviews_title),
      reviewsSubtitle: pickI18n(
        home.reviews_subtitle as I18nGroup,
        locale,
        DEFAULTS.home.reviews_subtitle,
      ),
      googleReviewsUrl: (home.google_reviews_url as string) || DEFAULTS.home.google_reviews_url,
      googleReviewsLabel: pickI18n(
        home.google_reviews_label as I18nGroup,
        locale,
        DEFAULTS.home.google_reviews_label,
      ),
    },
    footer: {
      tagline: pickI18n(footer.tagline as I18nGroup, locale, DEFAULTS.footer.tagline),
      copyrightName: (footer.copyright_name as string) || DEFAULTS.footer.copyright_name,
      rights: pickI18n(footer.rights as I18nGroup, locale, DEFAULTS.footer.rights),
      developedBy: pickI18n(footer.developed_by as I18nGroup, locale, DEFAULTS.footer.developed_by),
      developerName: (footer.developer_name as string) || DEFAULTS.footer.developer_name,
      developerUrl: (footer.developer_url as string) || DEFAULTS.footer.developer_url,
      rnc: (footer.rnc as string) || DEFAULTS.footer.rnc,
    },
    nav: {
      home: pickI18n(nav.home, locale, DEFAULTS.nav.home),
      shop: pickI18n(nav.shop, locale, DEFAULTS.nav.shop),
      categories: pickI18n(nav.categories, locale, DEFAULTS.nav.categories),
      account: pickI18n(nav.account, locale, DEFAULTS.nav.account),
      about: pickI18n(nav.about, locale, DEFAULTS.nav.about),
      faq: pickI18n(nav.faq, locale, DEFAULTS.nav.faq),
      terms: pickI18n(nav.terms, locale, DEFAULTS.nav.terms),
      privacy: pickI18n(nav.privacy, locale, DEFAULTS.nav.privacy),
      returns: pickI18n(nav.returns, locale, DEFAULTS.nav.returns),
      contactHeading: pickI18n(nav.contact_heading, locale, DEFAULTS.nav.contact_heading),
      quickNavHeading: pickI18n(nav.quick_nav_heading, locale, DEFAULTS.nav.quick_nav_heading),
      legalHeading: pickI18n(nav.legal_heading, locale, DEFAULTS.nav.legal_heading),
      instagramHeading: pickI18n(nav.instagram_heading, locale, DEFAULTS.nav.instagram_heading),
    },
    contact: {
      email: (contact.email as string) || DEFAULTS.contact.email,
      phone: (contact.phone as string) || DEFAULTS.contact.phone,
      phoneHref: `tel:+${phoneDigits.replace(/\D/g, '')}`,
      whatsappDisplay: (contact.whatsapp_display as string) || DEFAULTS.contact.whatsapp_display,
      whatsappHref: buildWhatsappHref(whatsappDigits, whatsappMessage),
      address: pickI18n(contact.address as I18nGroup, locale, DEFAULTS.contact.address),
      orderConfirmationWhatsapp:
        (contact.order_confirmation_whatsapp as string) ||
        DEFAULTS.contact.order_confirmation_whatsapp,
    },
    payment: {
      accounts: paymentAccounts,
      instructions: pickI18n(
        payment.transfer_instructions as I18nGroup,
        locale,
        DEFAULTS.payment.transfer_instructions,
      ),
    },
  };
});

export type LegalSlug = keyof typeof LEGAL_DEFAULTS;

export const getLegalPage = cache(async (slug: LegalSlug, locale: Locale): Promise<ContentPage> => {
  const doc = await loadStoreContentDoc();
  const legal = (doc?.legal ?? {}) as Record<string, Record<string, I18nGroup | undefined>>;
  const defaults = LEGAL_DEFAULTS[slug];
  return resolveContentPage(legal[slug], defaults, locale);
});

export const getFaqPage = cache(
  async (locale: Locale): Promise<{ title: string; items: FaqItem[] }> => {
    const doc = await loadStoreContentDoc();
    const faq = (doc?.faq ?? {}) as {
      title?: I18nGroup;
      items?: Array<{ question?: I18nGroup; answer?: I18nGroup }>;
    };

    const items =
      faq.items && faq.items.length > 0
        ? faq.items.map((item, index) => {
            const fallback = FAQ_DEFAULTS.items[index] ?? FAQ_DEFAULTS.items[0];
            return {
              question: pickI18n(item.question, locale, fallback.question),
              answer: pickI18n(item.answer, locale, fallback.answer),
            };
          })
        : FAQ_DEFAULTS.items.map((item) => ({
            question: pickI18n(item.question, locale, item.question),
            answer: pickI18n(item.answer, locale, item.answer),
          }));

    return {
      title: pickI18n(faq.title, locale, FAQ_DEFAULTS.title),
      items,
    };
  },
);

export const getAboutPage = cache(async (locale: Locale): Promise<ContentPage> => {
  const doc = await loadStoreContentDoc();
  const about = (doc?.about ?? {}) as Record<string, I18nGroup | undefined>;
  return {
    title: pickI18n(about.title, locale, ABOUT_DEFAULTS.title),
    updated: '',
    content: pickI18n(about.content, locale, ABOUT_DEFAULTS.content),
  };
});

export const STORE_CONTENT_SEED = DEFAULTS;
