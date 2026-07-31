# Despliegue en Vercel (MiddlePoint)

Monorepo npm workspaces: la app Next.js + Payload vive en `apps/web`.

Repo: https://github.com/Raydel91/middlepoint  
URL actual: **https://middlepointrd.vercel.app**

## 1. Base de datos (obligatorio)

PostgreSQL en Neon (u otro). Copia el connection string (pooler si Neon) en `DATABASE_URI` **solo en Vercel** — nunca en el repo.

**Primera vez en producción:** con el esquema vacío, en Vercel define temporalmente `PAYLOAD_DB_PUSH=true`, despliega una vez para que Drizzle cree tablas, y luego **quita** esa variable (o pon `false`) en siguientes despliegues.

## 2. Crear proyecto en Vercel

1. [vercel.com/new](https://vercel.com/new) → Importar `Raydel91/middlepoint`.
2. **Root Directory:** `apps/web`
3. Framework: Next.js. `vercel.json` define `installCommand` desde la raíz del monorepo.

## 3. Variables de entorno (Production)

| Variable | Valor |
|----------|--------|
| `DATABASE_URI` | Connection string de Neon |
| `PAYLOAD_SECRET` | Secreto ≥32 chars |
| `AUTH_SECRET` | Secreto ≥32 chars |
| `JWT_SECRET` | Secreto ≥32 chars |
| `JWT_REFRESH_SECRET` | Secreto ≥32 chars |
| `NEXT_PUBLIC_SERVER_URL` | `https://middlepointrd.vercel.app` |
| `AUTH_URL` | `https://middlepointrd.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | Lo crea Vercel al añadir Storage → Blob |
| `DEFAULT_CURRENCY` | `DOP` |
| `EXCHANGE_RATE_USD` | `58.50` (opcional; la tasa editable está en admin) |
| `PAYLOAD_DB_PUSH` | `true` solo en el **primer** deploy |

## 4. Tras el deploy

- Tienda: https://middlepointrd.vercel.app/es
- Admin: https://middlepointrd.vercel.app/admin (sin `/es`)

Si cambias el dominio `.vercel.app`, **actualiza** `NEXT_PUBLIC_SERVER_URL` y `AUTH_URL` y haz **Redeploy** (las `NEXT_PUBLIC_*` se fijan en el build).

## 5. Media / archivos (Vercel Blob)

1. Proyecto → **Storage** → **Create** → **Blob** (access: **public**).
2. Conéctalo al proyecto (Production + Preview). Aparecen `BLOB_STORE_ID` y, a veces, `BLOB_READ_WRITE_TOKEN`.
3. Redeploy.

En Vercel, MiddlePoint autentica con **OIDC** (`BLOB_STORE_ID` + `VERCEL_OIDC_TOKEN` automático). **No hace falta** pegar a mano el value de `BLOB_READ_WRITE_TOKEN` (si está Sensitive, Vercel lo oculta y el campo parece vacío).

Comprueba: https://middlepointrd.vercel.app/api/diagnostics/storage → `canUpload: true`.

Localmente: `vercel env pull` o un `BLOB_READ_WRITE_TOKEN` en `.env`.

**Sensitive:** no se puede editar ni volver a ver el value. Si necesitas el token RW estático: borra la variable y vuelve a conectar el store, o crea un Blob nuevo.

**No confundir** con Neon (`POSTGRES_*` / `DATABASE_URI`): Blob es Storage → Blob.
