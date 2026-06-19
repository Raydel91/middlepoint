/** Campos mínimos para tarjetas de producto en listados */
export const PRODUCT_CARD_SELECT = {
  id: true,
  slug: true,
  nombre: true,
  precio: true,
  calorias: true,
  galeria: true,
  imagen: true,
} as const;

/** Campos mínimos para tarjetas de categoría */
export const CATEGORY_CARD_SELECT = {
  id: true,
  slug: true,
  nombre: true,
  imagen: true,
  orden: true,
} as const;

/** depth 1: popula galería/imagen sin relaciones anidadas extra */
export const MEDIA_DEPTH = 1;
