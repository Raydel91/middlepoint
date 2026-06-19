/**
 * Normaliza slugs de rutas dinámicas. Next.js a veces entrega el segmento
 * aún con percent-encoding (p. ej. `ch%C3%ADa-...` en lugar de `chía-...`).
 */
export function normalizeRouteSlug(slug: string): string {
  let value = slug.trim();

  for (let i = 0; i < 2; i++) {
    if (!value.includes('%')) break;
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) break;
      value = decoded;
    } catch {
      break;
    }
  }

  return value;
}
