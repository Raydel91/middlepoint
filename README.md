# MiddlePoint

E-commerce wellness + logística — República Dominicana.

- **Repo:** https://github.com/Raydel91/middlepoint  
- **Demo (Vercel):** https://middlepointrd.vercel.app  
- **Dominio objetivo:** https://middlepointrd.com  

Documentación completa: **[docs/proyecto.md](docs/proyecto.md)**

## Stack

- **Frontend**: Next.js 15 App Router, Tailwind CSS 4, next-intl
- **Backend**: Payload CMS 3, PostgreSQL
- **Auth**: Auth.js, JWT + refresh tokens, bcrypt, CSRF, rate limiting
- **Media (prod)**: Vercel Blob
- **Monorepo**: npm workspaces (`apps/web`, `packages/shared`)

## Inicio rápido

```bash
# 1. Base de datos
npm run docker:up

# 2. Variables de entorno
cp .env.example .env

# 3. Dependencias
npm install

# 4. Desarrollo
npm run dev

# 5. Seed (primera vez)
npm run seed
```

| URL | Destino |
|-----|---------|
| http://localhost:3000/es | Tienda |
| http://localhost:3000/admin | Admin Payload |

## Cuentas demo (seed)

| Email | Password | Rol |
|-------|----------|-----|
| admin@middlepoint.do | Admin123! | super_admin |
| delivery@middlepoint.do | Delivery123! | delivery |
| cliente@demo.do | Cliente123! | cliente |

## Estructura

```
MiddlePoint/
├── apps/web/          # Next.js + Payload CMS
├── packages/shared/   # Types, RBAC, i18n utils
├── docs/              # Documentación y guías de despliegue
├── brand.json         # Identidad visual
└── docker-compose.yml # PostgreSQL local
```

## Tests

```bash
npm test
```

## Despliegue

| Destino | Guía |
|---------|------|
| **Vercel** (actual) | [docs/vercel.md](docs/vercel.md) |
| **Hostinger** + `middlepointrd.com` | [docs/hostinger.md](docs/hostinger.md) |

Resumen Hostinger: no usar hosting WordPress/compartido; usar **VPS** (recomendado) o Web Apps Node.js, PostgreSQL externo o en el VPS, DNS del dominio a la IP del servidor, Nginx + SSL, y `BLOB_READ_WRITE_TOKEN` para imágenes.
