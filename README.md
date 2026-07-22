# School ERP

Phase 1 foundation for a multi-tenant School ERP built for the Nepali market:
a Laravel API (PostgreSQL, Sanctum token auth) and a React/TypeScript SPA.
This phase ships the architectural skeleton — auth, routing, layout,
theming, and the mock-service pattern — that Phases 2–13 build on directly.

## Stack

- **API** (`apps/api`) — Laravel, PostgreSQL, Sanctum (Bearer token auth),
  modular `app/Modules/*` structure.
- **Web** (`apps/web`) — React 19, TypeScript (strict), Vite, Tailwind CSS,
  shadcn/ui, TanStack Query, Zustand, React Router, Framer Motion.

See [docs/adr/](docs/adr/) for the two foundational decisions (single-DB
multi-tenancy, token-based auth) and
[docs/architecture/service-pattern.md](docs/architecture/service-pattern.md)
for the mock-service convention every future integration follows.

## Prerequisites

- PHP 8.2+ and Composer
- PostgreSQL 14+
- Node.js 20+ and npm

On macOS, if you don't already have these:

```bash
brew install php composer postgresql@16
brew services start postgresql@16
```

## 1. Backend setup (`apps/api`)

```bash
cd apps/api
composer install
cp .env.example .env
php artisan key:generate
```

Create the database (name must match `DB_DATABASE` in `.env`):

```bash
createdb school_erp
```

Edit `.env` — the defaults below assume a local Postgres with no password
and the current OS user as the Postgres role. Adjust `DB_USERNAME` /
`DB_PASSWORD` to match your local setup:

```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=school_erp
DB_USERNAME=postgres
DB_PASSWORD=

FRONTEND_URL=http://localhost:5173
```

Run migrations and seed the demo school + admin user:

```bash
php artisan migrate
php artisan db:seed
```

Start the API:

```bash
php artisan serve --port=8000
```

The API is now at `http://localhost:8000/api`.

## 2. Frontend setup (`apps/web`)

```bash
cd apps/web
npm install
cp .env.example .env
npm run dev
```

The app is now at `http://localhost:5173`.

`.env` values:

```
VITE_API_URL=http://localhost:8000/api
VITE_USE_MOCK_NOTIFICATIONS=true
```

## Demo login

Seeded by `DemoSeeder` (`apps/api/database/seeders/DemoSeeder.php`):

| Field    | Value                       |
| -------- | ---------------------------- |
| Email    | `admin@demo-school.edu.np`   |
| Password | `Demo@Passw0rd`               |

## Useful commands

```bash
# Backend
cd apps/api
php artisan test          # (Phase 13)
./vendor/bin/pint          # code style (PSR-12)
php artisan migrate:fresh --seed   # reset DB

# Frontend
cd apps/web
npm run lint
npm run format
npm run build
```

## Project layout

```
school-erp/
├── apps/
│   ├── web/    React + TypeScript frontend
│   └── api/    Laravel backend
├── docs/
│   ├── architecture/service-pattern.md
│   └── adr/
```

Everything not built in this phase (Students, Teachers, Attendance, Gate
Scanner, Barcode, SMS, Reports, real Settings persistence) is reachable from
the sidebar as a placeholder page marked "Coming in Phase N" — the routes
and navigation are stable so later phases only need to fill in the pages.
