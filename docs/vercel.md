# Despliegue en Vercel (MiddlePoint)

Monorepo npm workspaces: la app Next.js + Payload vive en `apps/web`.

Repo: https://github.com/Raydel91/middlepoint  
URL objetivo: **https://middlepoint.vercel.app**

## 1. Base de datos (obligatorio)

PostgreSQL en Neon (u otro). Copia el connection string (pooler si Neon) en `DATABASE_URI` **solo en Vercel** — nunca en el repo.

**Primera vez en producción:** con el esquema vacío, en Vercel define temporalmente `PAYLOAD_DB_PUSH=true`, despliega una vez para que Drizzle cree tablas, y luego **quita** esa variable (o pon `false`) en siguientes despliegues.

## 2. Crear proyecto en Vercel

1. [vercel.com/new](https://vercel.com/new) → Importar `Raydel91/middlepoint`.
2. **Project Name:** `middlepoint` → URL `https://middlepoint.vercel.app`
3. **Root Directory:** `apps/web`
4. Framework: Next.js. `vercel.json` define `installCommand` desde la raíz del monorepo.

## 3. Variables de entorno (Production)

| Variable | Valor |
|----------|--------|
| `DATABASE_URI` | Connection string de Neon |
| `PAYLOAD_SECRET` | Secreto ≥32 chars |
| `AUTH_SECRET` | Secreto ≥32 chars |
| `JWT_SECRET` | Secreto ≥32 chars |
| `JWT_REFRESH_SECRET` | Secreto ≥32 chars |
| `NEXT_PUBLIC_SERVER_URL` | `https://middlepoint.vercel.app` |
| `AUTH_URL` | `https://middlepoint.vercel.app` |
| `TZ` | `America/Santo_Domingo` |
| `DEFAULT_CURRENCY` | `DOP` |
| `EXCHANGE_RATE_USD` | `58.50` |
| `PAYLOAD_DB_PUSH` | `true` solo en el **primer** deploy |

Opcionales: `SMTP_*`, `WHATSAPP_WEBHOOK_URL`, Upstash Redis.

## 4. Tras el deploy

- Tienda: https://middlepoint.vercel.app/es
- Admin: https://middlepoint.vercel.app/admin
- Quitar `PAYLOAD_DB_PUSH` y crear usuario admin / seed.

## 5. Media / archivos

Uploads en disco local no persisten en serverless. Para producción planifica S3 (o compatible) con adaptador Payload.
