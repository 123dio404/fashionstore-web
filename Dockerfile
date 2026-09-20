# Etapa 1: compilar la aplicación Angular
FROM node:22-alpine AS build

WORKDIR /app

# Dependencias (capa cacheable)
COPY package.json package-lock.json ./
RUN npm ci

# Código y compilación de producción
COPY . .

# Opcional: fija la URL de la API sin editar archivos
#   docker build --build-arg API_URL=https://api.tudominio.com/api/v1 -t fashionstore-web .
ARG API_URL
RUN if [ -n "$API_URL" ]; then \
        sed -i "s#https://api.fashionstore.example.com/api/v1#${API_URL}#" src/environments/environment.production.ts; \
    fi

RUN npm run build

# Etapa 2: servir los archivos estáticos con Nginx
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/fashionstore-web/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
    CMD wget -qO- http://127.0.0.1/healthz || exit 1
