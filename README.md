# MiddlePoint

E-commerce wellness + logística — República Dominicana

## Stack

- **Frontend**: Next.js 15 App Router, Tailwind CSS 4, next-intl
- **Backend**: Payload CMS 3, PostgreSQL
- **Auth**: Auth.js, JWT + refresh tokens, bcrypt, CSRF, rate limiting
- **Monorepo**: npm workspaces

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

App: http://localhost:3000/es  
Admin Payload: http://localhost:3000/admin

## Cuentas demo

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
├── brand.json         # Identidad visual
└── docker-compose.yml # PostgreSQL
```

## Tests

```bash
npm test
```

## Despliegue (Vercel)

Guía paso a paso: [docs/vercel.md](docs/vercel.md) — root `apps/web`, PostgreSQL externo (Neon/Supabase), variables de entorno y notas sobre media en serverless.
