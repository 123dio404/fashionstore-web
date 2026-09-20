# Despliegue de la web (Angular 20)

La aplicación es **estática**: se compila con `npm run build` y el resultado queda en
`dist/fashionstore-web/browser`. Hay tres caminos, todos ya configurados en este repo.

> **La web necesita la API en algún lado.** Desplegar solo la web en Vercel deja un sitio que no
> carga datos: el backend (FastAPI + PostgreSQL) va aparte — por ejemplo en Railway (ver
> `fashionstore-backend/DEPLOY.md`). Orden recomendado: **1) backend, 2) web, 3) CORS**.

## 0. Antes de compilar: apunta la API

Dos formas, elige una:

**a) Variable de entorno (recomendado para Vercel/Railway/CI).** El hook `prebuild` ejecuta
`scripts/set-api-url.mjs` y escribe la URL en el entorno de producción:

```bash
API_URL=https://mi-api.up.railway.app/api/v1 npm run build
```

En Vercel: *Project → Settings → Environment Variables → `API_URL`* (Production) y redeploy.

**b) Editando el archivo.** `src/environments/environment.production.ts`, una sola línea:

```ts
apiUrl: 'https://api.fashionstore.example.com/api/v1'
```

Recuerda que ese dominio debe estar en `CORS_ORIGINS` del backend, o el navegador bloqueará las
llamadas. Durante el desarrollo (`npm start`) se usa `environment.development.ts` con
`http://localhost:8000/api/v1`.

## Opción A — Vercel (la más rápida) ⭐

Solo se despliega **este repo**; la API va en otro servicio.

1. **Import Project** → repositorio `fashionstore-web`. Vercel detecta Angular y usa `vercel.json`:
   - Build Command: `npm run build`
   - Output Directory: `dist/fashionstore-web/browser`
   - Install Command: `npm ci`
   - Rewrites: `/(.*) → /index.html` (necesario para que un F5 en `/pos` no dé 404)
2. **Environment Variables** → `API_URL = https://<tu-api>/api/v1` (entorno Production).
3. **Deploy** y copia el dominio que te da (`https://fashionstore-web.vercel.app`).
4. Vuelve al backend y agrega ese dominio a `CORS_ORIGINS`, luego redeploy del backend.
5. Prueba: `/catalog` carga prendas y el login del administrador entra.

Cada `git push` a la rama conectada vuelve a desplegar automáticamente.

> Si prefieres desplegar una **Preview** de otra rama (por ejemplo el PR), funciona igual: Vercel
> crea una URL por rama y puedes apuntar `API_URL` a la misma API.

## Opción B — Cloudflare Pages / Netlify

Mismos tres datos que Vercel. El rewrite de SPA ya viene en `public/_redirects`
(`/*  /index.html  200`), que ambas plataformas copian al publicar.

| Plataforma | Build | Directorio de publicación |
| :-- | :-- | :-- |
| Netlify / Cloudflare Pages | `API_URL=... npm run build` | `dist/fashionstore-web/browser` |

## Opción C — GitHub Pages

```bash
API_URL=https://<tu-api>/api/v1 npm run build -- --base-href /fashionstore-web/
```

Publica `dist/fashionstore-web/browser` en la rama `gh-pages`. Ojo: GitHub Pages **no** permite
rewrites, así que las recargas profundas (por ejemplo `/pos`) darán 404; para la demo usa Vercel o
Docker.

## Opción D — Docker con Nginx (servidor propio o Railway)

```bash
docker build --build-arg API_URL=https://api.tudominio.com/api/v1 -t fashionstore-web .
docker run -d --name fashionstore-web -p 80:80 --restart unless-stopped fashionstore-web
```

El `Dockerfile` compila con Node 22 y sirve el resultado con Nginx (`nginx.conf`): gzip, caché
inmutable para los archivos con hash, `no-cache` para `index.html`, `/healthz` y fallback de SPA.

### Un solo origen (sin CORS)

`nginx.conf` trae (comentado) un `proxy_pass` a la API. Si lo activas:

1. descomenta el bloque `location /api/`,
2. compila con `API_URL=/api/v1` (o `--build-arg`),
3. levanta los contenedores en la misma red de Docker con el nombre `api` para la API.

Ventaja: navegador y API comparten dominio, así que no hay CORS ni mixed content.

## Verificación después de desplegar

1. El catálogo público carga en `/catalog` (sin sesión) → la API responde.
2. `Iniciar sesión` con el administrador creado por el backend (`scripts/create_admin.py`) → aparece
   el menú completo de Administrador.
3. `/pos` abre la caja y carga el stock (el usuario debe ser Cajero/Encargado/Administrador).
4. Recarga profunda (F5) en `/pos` o `/reports/dashboard` → debe seguir funcionando (rewrite de SPA).

## Checklist rápido

- [ ] `API_URL` configurada en el hosting (o la línea de `environment.production.ts`)
- [ ] El dominio de la web está en `CORS_ORIGINS` del backend
- [ ] El backend responde en `/health` y tiene un usuario Administrador
- [ ] El hosting tiene el rewrite de SPA activo
