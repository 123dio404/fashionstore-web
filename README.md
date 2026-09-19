# FashionStore Web

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.36.

## Development server

To start a local development server, run:

```bash
npm start
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Backend connection

The Angular API base URL is configured in `src/environments/environment.ts`:

```text
http://127.0.0.1:8000/api/v1
```

Start the FastAPI backend before using the API (from the `fashionstore-backend` repository):

```bash
uvicorn main:app --reload
```

`AuthService` implements registration, OAuth2 form login, current-user retrieval and profile updates. `authInterceptor` automatically sends the stored JWT as a Bearer token on backend requests. The backend contract is stored in `openapi.json`.

The CORS configuration of the backend already allows `http://localhost:4200` and `http://127.0.0.1:4200`.

## Implemented use cases

| CU | Feature | Route |
| :--: | :-- | :-- |
| CU01 | Registro de cliente | `/auth/register` |
| CU02 | Inicio de sesión y perfil | `/auth/login`, `/profile` |
| CU03 | Gestión de usuarios y roles | `/admin/users` |
| CU04 | Gestión de sucursales y ciudades | `/admin/branches` |
| CU05 | Gestión del catálogo de prendas | `/admin/products` |
| CU06 | Gestión de parámetros (categorías, temporadas, tallas, colores) | `/admin/parameters` |
| CU07 | Gestión de proveedores | `/admin/suppliers` |
| CU08 | Consulta de catálogo y disponibilidad | `/catalog`, `/catalog/:id` |
| CU09 | Inventario multisucursal y movimientos | `/admin/inventory` |
| CU10 | Carrito de compras | `/cart` |
| CU11 | Compra digital (Stripe vía backend) | `/cart` |
| CU12 | Venta presencial en caja (POS) | `/pos` |
| CU14 | Atención y gestión de reservas en tienda | `/reservations` |
| CU15 | Consulta y cancelación de reservas | `/my-reservations` |
| CU16 | Historial de compras | `/purchase-history` |
| CU18 | Recomendaciones personalizadas con IA | `/recommendations` |
| CU19 | Chatbot inteligente | `/chatbot` |
| CU20 | Colecciones y promociones | `/admin/marketing` |
| CU21 | Reportes de ventas | `/reports/sales` |
| CU22 | Reportes de inventario | `/reports/inventory` |
| CU23 | Dashboard gerencial | `/reports/dashboard` |
| CU24 | Reportes analíticos por voz / IA | `/reports/analytical` |

CU13 (reserva de probador físico) and CU17 (vestidor virtual con RA) are mobile-only per the specification.

## Extra modules

Beyond the use cases, the management area also includes two additional modules backed by the API:

- **Finanzas** (`/admin/finance`): cuotas/expensas, pagos, multas y reporte financiero (`/finance`).
- **Operaciones** (`/admin/operations`): instalaciones, mantenimiento, disponibilidad, reservas y reporte de uso (`/operations`).

## Project structure

```text
src/app/
  core/
    guards/         authGuard, roleGuard
    interceptors/   jwtInterceptor, errorInterceptor
    services/       auth, users, branches, products, suppliers,
                    inventory, commerce, marketing, reports, experience
  models/           API contract models (one file per domain)
  pages/            Standalone feature pages, lazy loaded by route
```

Navigation in the shell (`app.html`) is role-aware: management links require `Administrador`/`Encargado`, administration and reports require `Administrador`, and POS/reservations require staff roles.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
