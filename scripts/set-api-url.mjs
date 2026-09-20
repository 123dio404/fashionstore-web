/**
 * Fija la URL de la API en el entorno de producción a partir de la variable API_URL.
 *
 * Se ejecuta automáticamente antes de `npm run build` (hook `prebuild`), así que Vercel, Railway,
 * GitHub Actions o Docker pueden definir el destino sin editar el archivo a mano:
 *
 *     API_URL=https://mi-api.up.railway.app/api/v1 npm run build
 *
 * Si API_URL no está definida, no toca nada y se usa el valor del archivo (útil en local).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, '../src/environments/environment.production.ts');

const apiUrl = process.env.API_URL?.trim();

if (!apiUrl) {
  console.log('[set-api-url] API_URL no definida: se mantiene el valor del archivo.');
  process.exit(0);
}

if (!/^https?:\/\//.test(apiUrl) && !apiUrl.startsWith('/')) {
  console.error(`[set-api-url] API_URL inválida: "${apiUrl}". Usa https://... o una ruta relativa /api/v1`);
  process.exit(1);
}

const current = readFileSync(target, 'utf8');
const updated = current.replace(/apiUrl:\s*'[^']*'/, `apiUrl: '${apiUrl}'`);

if (updated === current) {
  console.error('[set-api-url] No se encontró la línea apiUrl en environment.production.ts');
  process.exit(1);
}

writeFileSync(target, updated);
console.log(`[set-api-url] apiUrl de producción fijada en ${apiUrl}`);
