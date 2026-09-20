# Despliegue de la web (Angular 20)

La aplicación es **estática**: se compila con `npm run build` y el resultado queda en
`dist/fashionstore-web/browser`. Hay tres caminos, todos ya configurados en este repo.

## 0. Antes de compilar: apunta la API

`src/environments/environment.production.ts` tiene **una sola línea** que debes ajustar:

```ts
apiUrl: 'https://api.fashionstore.example.com/api/v1'
```

con el dominio real del backend (con `/api/v1` al final). Con Docker puedes evitarlo usando el
build-arg `API_URL` (ver opción C). Recuerda que ese dominio también debe estar en
`CORS_ORIGINS` del backend, o el navegador bloqueará las llamadas.

> Durante el desarrollo (`npm start`) se usa `environment.development.ts` con
> `http://localhost:8000/api/v1`; la configuración de producción solo entra al compilar.

## Opción A — Hosting estático (Netlify / Cloudflare Pages / Vercel)

Ya están incluidos `public/_redirects` (Netlify y Cloudflare Pages) y `vercel.json` (Vercel) con el
**rewrite de SPA**, necesario para que al recargar `/catalog/5` o `/pos` no dé 404.

| Plataforma | Build | Directorio de publicación |
| :-- | :-- | :-- |
| Netlify / Cloudflare Pages | `npm run build` | `dist/fashionstore-web/browser` |
| Vercel | detectado por `vercel.json` | `dist/fashionstore-web/browser` |

## Opción B — GitHub Pages

```bash
npm run build -- --base-href /fashionstore-web/
```

Publica `dist/fashionstore-web/browser` en la rama `gh-pages`. Ojo: GitHub Pages **no** permite
rewrites, así que las recargas profundas de rutas (por ejemplo `/pos`) darán 404; para una demo de
una sola sesión funciona, pero es preferible la opción A o C.

## Opción C — Docker con Nginx (recomendado para el servidor)

```bash
docker build --build-arg API_URL=https://api.tudominio.com/api/v1 -t fashionstore-web .
docker run -d --name fashionstore-web -p 80:80 --restart unless-stopped fashionstore-web
```

El `Dockerfile` compila con Node 22 y sirve el resultado con Nginx (`nginx.conf`): gzip, caché
inmutable para los archivos con hash, `no-cache` para `index.html`, `/healthz` y fallback de SPA.

### Un solo origen (sin CORS)

`nginx.conf` trae (comentado) un `proxy_pass` a la API. Si lo activas:

1. descomenta el bloque `location /api/`,
2. compila con `--build-arg API_URL=/api/v1`,
3. levanta los contenedores en la misma red de Docker con el nombre `api` para la API.

Ventaja: navegador y API comparten dominio, así que no hay CORS ni mixed content.

## Verificación después de desplegar

1. El catálogo público carga en `/catalog` (sin sesión) → la API responde.
2. `Iniciar sesión` con el administrador creado por el backend (`scripts/create_admin.py`) → aparece
   el menú completo de Administrador.
3. `/pos` abre la caja y carga el stock (el usuario debe ser Cajero/Encargado/Administrador).
4. Recarga profunda (F5) en `/pos` o `/reports/dashboard` → debe seguir funcionando (rewrite de SPA).

## Checklist rápido

- [ ] `environment.production.ts` apunta al dominio real de la API
- [ ] El dominio de la web está en `CORS_ORIGINS` del backend
- [ ] El backend responde en `/health` y tiene un usuario Administrador
- [ ] El hosting tiene el rewrite de SPA activo
