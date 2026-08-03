# Despliegue en Hostinger — middlepointrd.com

Guía para pasar MiddlePoint (Next.js 15 + Payload + PostgreSQL) a Hostinger con el dominio **https://middlepointrd.com**.

> **Importante:** el hosting compartido / WordPress de Hostinger **no sirve** para este proyecto. Hace falta un entorno Node.js persistente (VPS o Web Apps Node.js) + PostgreSQL + almacenamiento de media.

## Resumen de lo que hay que hacer

1. Contratar el plan correcto en Hostinger (recomendado: **VPS**).
2. Tener PostgreSQL (en el VPS o externo, p. ej. Neon).
3. Configurar DNS del dominio `middlepointrd.com` hacia Hostinger.
4. Clonar el repo, instalar, configurar `.env`, build y arrancar con PM2.
5. Nginx + HTTPS (Let’s Encrypt).
6. Media: token de **Vercel Blob** (`BLOB_READ_WRITE_TOKEN`) — OIDC de Vercel no funciona fuera de Vercel.
7. Actualizar `NEXT_PUBLIC_SERVER_URL` y `AUTH_URL` a `https://middlepointrd.com` y redesplegar.
8. (Opcional) Apagar o redirigir el deploy de Vercel.

---

## 1. Qué plan de Hostinger usar

| Opción | ¿Sirve? | Notas |
|--------|---------|--------|
| Hosting compartido / WordPress | No | Sin Node SSR fiable, sin tu stack |
| **Web Apps / Node.js** (Business/Cloud) | Posible | Deploy desde GitHub; conviene DB y Blob externos |
| **VPS (KVM)** — recomendado | Sí | Control total: Node, Nginx, PM2, Postgres opcional |

Recomendación para producción con Payload + catálogo + admin: **VPS Ubuntu 22.04/24.04**, al menos **2 GB RAM** (ideal 4 GB). Node ≥ 20.

---

## 2. Dominio middlepointrd.com

### Si el dominio está en Hostinger

1. hPanel → **Dominios** → `middlepointrd.com`.
2. DNS:
   - Registro **A** `@` → IP pública del VPS.
   - Registro **A** `www` → misma IP (o CNAME `www` → `@`).
3. Espera propagación (minutos a unas horas). Comprueba: `nslookup middlepointrd.com`.

### Si el dominio está en otro registrador

Apunta los nameservers a Hostinger **o** crea los mismos registros A en el DNS del registrador hacia la IP del VPS.

### SSL

En VPS: Certbot (paso 7). En Web Apps: suele emitirse desde hPanel al asignar el dominio.

---

## 3. Base de datos PostgreSQL

MiddlePoint **requiere PostgreSQL** (no MySQL de Hostinger compartido).

Opciones:

**A) Neon / Supabase (sencillo)**  
- Crea un proyecto, copia el connection string (pooler).  
- Variable: `DATABASE_URI=postgresql://...`

**B) PostgreSQL en el mismo VPS**

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres createuser -P middlepoint
sudo -u postgres createdb -O middlepoint middlepoint
```

`DATABASE_URI=postgresql://middlepoint:TU_PASSWORD@127.0.0.1:5432/middlepoint`

**Primera sincronización de esquema:** con la BD vacía, un deploy con `PAYLOAD_DB_PUSH=true`, luego **quitarlo** o ponerlo en `false`.

---

## 4. Media (imágenes)

En producción el código fuerza Vercel Blob (no escribe carpeta local `media`).

Fuera de Vercel:

1. En [Vercel](https://vercel.com) → Storage → Blob (puede ser el store actual).
2. Crea/obtén un token **Read-Write** (`BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...`).
3. Ponlo en el `.env` del servidor Hostinger.

Sin ese token, el admin no podrá subir imágenes.

---

## 5. Despliegue en VPS (paso a paso)

### 5.1 Conectar y paquetes base

```bash
ssh root@IP_DEL_VPS

apt update && apt upgrade -y
apt install -y git nginx certbot python3-certbot-nginx build-essential
```

Node.js 20+ (NodeSource o nvm). Ejemplo NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # >= 20
npm i -g pm2
```

### 5.2 Clonar el monorepo

```bash
mkdir -p /var/www && cd /var/www
git clone https://github.com/Raydel91/middlepoint.git
cd middlepoint
```

Si el repo es privado: deploy key o HTTPS con token.

### 5.3 Variables de entorno

Crea `/var/www/middlepoint/apps/web/.env` (o `.env` en la raíz si tu flujo lo carga; la app usa las vars del proceso):

```env
DATABASE_URI=postgresql://...
PAYLOAD_SECRET=...mínimo-32-caracteres...
AUTH_SECRET=...mínimo-32-caracteres...
JWT_SECRET=...mínimo-32-caracteres...
JWT_REFRESH_SECRET=...mínimo-32-caracteres...
NEXT_PUBLIC_SERVER_URL=https://middlepointrd.com
AUTH_URL=https://middlepointrd.com
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
DEFAULT_CURRENCY=DOP
EXCHANGE_RATE_USD=58.50
TZ=America/Santo_Domingo
PAYLOAD_DB_PUSH=true
```

Tras el **primer** build exitoso con tablas creadas, cambia a `PAYLOAD_DB_PUSH=false`.

### 5.4 Install, build y arranque

Desde la **raíz del monorepo**:

```bash
cd /var/www/middlepoint
npm install
npm run build
```

El build de `apps/web` puede ejecutar `push-schema` si `PAYLOAD_DB_PUSH=true`.

Arranque con PM2 (puerto 3000):

```bash
cd /var/www/middlepoint
pm2 start npm --name middlepoint -- start
pm2 save
pm2 startup
```

Comprueba: `curl -I http://127.0.0.1:3000/es`

### 5.5 Nginx (reverse proxy)

`/etc/nginx/sites-available/middlepointrd.com`:

```nginx
server {
    listen 80;
    server_name middlepointrd.com www.middlepointrd.com;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/middlepointrd.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 5.6 HTTPS

```bash
certbot --nginx -d middlepointrd.com -d www.middlepointrd.com
```

### 5.7 Actualizaciones siguientes

```bash
cd /var/www/middlepoint
git pull
npm install
# PAYLOAD_DB_PUSH=false en .env
npm run build
pm2 restart middlepoint
```

---

## 6. Alternativa: Hostinger Web Apps (Node.js)

Si usas el producto **Web Apps / Node.js** de Hostinger (sin gestionar VPS):

1. hPanel → crear sitio **Node.js web app**.
2. Conectar GitHub `Raydel91/middlepoint`, branch `master`.
3. Ajustar si el panel lo permite:
   - **Root / monorepo:** instalar desde la raíz (`npm install` en `/`).
   - **Build:** `npm run build` (workspace web).
   - **Start:** `npm run start`.
4. Variables de entorno (mismas que arriba, con `https://middlepointrd.com`).
5. Asignar dominio `middlepointrd.com` en hPanel y SSL.

Si el panel solo permite root en `apps/web`, el monorepo puede fallar (`@middlepoint/shared`). En ese caso conviene **VPS** o un script de install que suba un nivel (`cd ../.. && npm install`).

---

## 7. Checklist post-deploy

| Comprobación | URL / acción |
|--------------|--------------|
| Tienda ES | https://middlepointrd.com/es |
| Tienda EN | https://middlepointrd.com/en |
| Admin | https://middlepointrd.com/admin |
| Login / sesión | Auth con `AUTH_URL` correcto |
| Subida de imagen | Admin → Media |
| Diagnóstico Blob | https://middlepointrd.com/api/diagnostics/storage → `canUpload: true` |
| SEO / OG | `NEXT_PUBLIC_SERVER_URL` = dominio canónico |

---

## 8. Migrar desde Vercel (middlepointrd.vercel.app)

1. Usa la **misma** BD Neon (o export/import) para no perder datos.
2. Copia secretos; cambia URLs a `https://middlepointrd.com`.
3. Emite `BLOB_READ_WRITE_TOKEN` (no dependas de OIDC).
4. Cuando Hostinger responda bien: en el registrador DNS ya no debe apuntar a Vercel; opcionalmente borra el proyecto Vercel o deja un redirect.
5. Actualiza enlaces en Google Search Console / Analytics al dominio nuevo.

---

## 9. Limitaciones y riesgos a tener en cuenta

- **RAM:** el build de Next + Payload es pesado; en VPS pequeños puede hacer falta `NODE_OPTIONS=--max-old-space-size=4096` (ya está en los scripts de build).
- **PAYLOAD_DB_PUSH** en cada deploy de producción es peligroso; solo primer setup.
- Hostinger **no** sustituye Vercel Blob automáticamente: el token RW es obligatorio.
- Email SMTP y WhatsApp siguen siendo opcionales (variables en `.env.example`).

---

## Referencias

- Documentación del proyecto: [proyecto.md](./proyecto.md)
- Despliegue Vercel actual: [vercel.md](./vercel.md)
- Variables: [`.env.example`](../.env.example)
- Repo: https://github.com/Raydel91/middlepoint
