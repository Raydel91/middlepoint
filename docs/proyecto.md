# MiddlePoint — Documentación del proyecto

E-commerce wellness + logística para República Dominicana.

- **Repo:** https://github.com/Raydel91/middlepoint
- **Demo actual (Vercel):** https://middlepointrd.vercel.app
- **Dominio objetivo:** https://middlepointrd.com

## Qué es

Tienda online bilingüe (ES/EN) con catálogo, carrito, checkout, cuenta de cliente, notificaciones, mensajes de soporte, pedidos, entregas y panel de administración (Payload CMS). Moneda principal DOP; zona horaria `America/Santo_Domingo`.

## Stack

| Capa | Tecnología |
|------|------------|
| App | Next.js 15 (App Router) + React 19 |
| CMS / API | Payload CMS 3 |
| Base de datos | PostgreSQL |
| Auth tienda | Auth.js (next-auth) + JWT |
| i18n | next-intl + campos `{ es, en }` |
| Estilos | Tailwind CSS 4 |
| Media (prod) | Vercel Blob |
| Monorepo | npm workspaces |

## Estructura del monorepo

```
MiddlePoint/
├── apps/web/                 # Next.js + Payload (única app desplegable)
│   ├── src/app/              # Rutas (tienda, API, admin Payload)
│   ├── src/collections/      # Users, Products, Categories, Orders, …
│   ├── src/globals/          # StoreContent, Settings, …
│   ├── src/components/       # UI tienda + admin
│   ├── src/lib/              # Auth, SEO, pedidos, storage, etc.
│   ├── src/services/         # Product, Order, Delivery, Analytics…
│   ├── messages/             # es.json / en.json
│   └── vercel.json
├── packages/shared/          # Types, RBAC, i18n helpers, moneda
├── docs/                     # Guías de despliegue y arquitectura
├── brand.json                # Identidad visual
├── docker-compose.yml        # PostgreSQL local
└── .env.example
```

## Roles (RBAC)

Definidos en `packages/shared` (`canAccess`):

| Rol | Uso típico |
|-----|------------|
| `super_admin` | Acceso total |
| `operador` | Pedidos, entregas, productos |
| `marketing` | Catálogo limitado (descripción, SEO, galería, redes) |
| `cliente` | Cuenta, pedidos propios |
| `delivery` | Entregas asignadas |

Admin Payload: `/admin` (sin prefijo de locale). Tienda: `/es` o `/en`.

## Funcionalidades principales

- Catálogo por categorías/productos con SEO editable (meta, OG, robots, preview Google)
- Redes sociales por categoría / negocio (admin)
- Carrito y checkout (transferencia / flujo actual)
- Cuenta: perfil, pedidos, recibos PDF, notificaciones, soporte
- Inbox de soporte y acciones de pedidos en admin
- Contenido de tienda editable (Store Content): hero, footer, negocio, etc.

## Desarrollo local

Requisitos: Node.js ≥ 20, Docker (PostgreSQL).

```bash
npm run docker:up
cp .env.example .env   # ajustar secretos
npm install
npm run dev
npm run seed           # primera vez
```

| URL | Destino |
|-----|---------|
| http://localhost:3000/es | Tienda |
| http://localhost:3000/admin | Payload |

Cuentas seed: ver [README](../README.md).

## Variables de entorno clave

Ver `.env.example`. Mínimo en producción:

- `DATABASE_URI` — PostgreSQL
- `PAYLOAD_SECRET`, `AUTH_SECRET`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `NEXT_PUBLIC_SERVER_URL`, `AUTH_URL` — URL pública (https://middlepointrd.com)
- `BLOB_READ_WRITE_TOKEN` — subida de media (fuera de Vercel es obligatorio el token RW)
- `PAYLOAD_DB_PUSH=true` — **solo** primer deploy / migraciones controladas; luego `false`

## Despliegue

| Destino | Guía |
|---------|------|
| Vercel (actual) | [vercel.md](./vercel.md) |
| Hostinger + dominio `middlepointrd.com` | [hostinger.md](./hostinger.md) |

## Tests

```bash
npm test
```
