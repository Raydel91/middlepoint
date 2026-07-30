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

URL real del proyecto: `https://middlepoint-khaki.vercel.app`

- Tienda: https://middlepoint-khaki.vercel.app/es
- Admin: https://middlepoint-khaki.vercel.app/admin (sin `/es`)

Con `PAYLOAD_DB_PUSH=true`, el build fuerza `NODE_ENV=development` solo en el script de push (Payload no hace push en production). Cuando veas tablas en Neon, quita esa variable y redespliega.

Actualiza también:
- `NEXT_PUBLIC_SERVER_URL=https://middlepoint-khaki.vercel.app`
- `AUTH_URL=https://middlepoint-khaki.vercel.app`

## 5. Media / archivos (Vercel Blob)

En Vercel el disco no persiste; hay que usar Blob:

1. Proyecto en Vercel → **Storage** → **Create** → **Blob** (access: **public**).
2. Conéctalo al proyecto; Vercel añade `BLOB_READ_WRITE_TOKEN`.
3. Redeploy.

Sin ese token, guardar categorías/productos con imagen falla.
Localmente, sin token, sigue usándose la carpeta `media/` en disco.
