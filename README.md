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

## Setup (one-time)

### Backend (`apps/api`)

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

Run migrations and seed the demo users:

```bash
php artisan migrate
php artisan db:seed
```

### Frontend (`apps/web`)

```bash
cd apps/web
npm install
cp .env.example .env
```

`.env` values:

```
VITE_API_URL=http://localhost:8000/api
VITE_USE_MOCK_NOTIFICATIONS=true
VITE_USE_MOCK_GATE_FEED=true
```

## Running the app

### Recommended: one command, from the repo root

```bash
npm install
npm run dev
```

This starts both the API (`php artisan serve`) and the frontend (`vite`)
together, with output clearly prefixed `[api]` / `[web]` so it's obvious
which process logged what. It also checks that PostgreSQL is actually
running before starting anything — if it isn't, you get a clear message
telling you how to start it instead of a confusing connection-refused
error a few steps downstream:

```
✖ PostgreSQL is not running (or not reachable on the default port).

Start it, then re-run `npm run dev`. On macOS with Homebrew:
  brew services start postgresql@16
```

Once both are up: the app is at `http://localhost:5173`, the API at
`http://localhost:8000/api`.

### Manual, two terminals (fallback / to see what's actually happening)

```bash
# Terminal 1
cd apps/api && php artisan serve --port=8000

# Terminal 2
cd apps/web && npm run dev
```

This is what `npm run dev` at the root does for you — reach for this only
if you need to watch one app's output in isolation, or debug the startup
of just one side.

## Demo login

Seeded by `DemoSeeder` (`apps/api/database/seeders/DemoSeeder.php`). All
four demo users share the same password; each has a different role, which
determines which sidebar modules and API endpoints they can access (see
`docs/adr/0003-static-role-capability-map.md`).

| Role        | Email                          | Password       |
| ----------- | ------------------------------- | -------------- |
| super_admin | `superadmin@school-erp.dev`     | `Demo@Passw0rd` |
| admin       | `admin@demo-school.edu.np`      | `Demo@Passw0rd` |
| teacher     | `teacher@demo-school.edu.np`    | `Demo@Passw0rd` |
| guard       | `guard@demo-school.edu.np`      | `Demo@Passw0rd` |

There is no `parent` demo user — the parent role is out of scope until its
own portal is built (a distinct route tree, not a restricted view of the
staff dashboard).

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

## Backend conventions

- **Never return a raw `User` model (or a relation that resolves to one)
  directly from a controller or response.** Always route it through
  `App\Http\Resources\UserResource`, or a narrower purpose-built resource
  (e.g. `TeacherResource` for the `classTeacher` relation on `SchoolClass`,
  which only ever needs `id`/`name`/`email`) if `UserResource`'s full field
  set doesn't apply.

  `User::$hidden` (`protected $hidden = ['password', 'remember_token'];`)
  suppresses those columns at the model level and covers `toArray()`,
  `toJson()`, and nested eager-loaded relations — but a Resource wrap is
  still required everywhere as defense in depth, not as redundant busywork:
  it fixes the field list explicitly regardless of what a future migration,
  column addition, or `$hidden` edit might change. Do not rely on `$hidden`
  alone, and do not use column-limited eager loads (`->with('relation:col1,col2')`)
  as a substitute for a Resource — that only narrows what's *fetched*, not
  what a controller is allowed to *return*.

## Project layout

```
school-erp/
├── apps/
│   ├── web/    React + TypeScript frontend
│   └── api/    Laravel backend
├── scripts/
│   └── check-postgres.js   # pre-flight check used by `npm run dev`
├── docs/
│   ├── architecture/service-pattern.md
│   └── adr/
```

Everything not built in this phase (Students, Teachers, Attendance, Gate
Scanner, Barcode, SMS, Reports, real Settings persistence) is reachable from
the sidebar as a placeholder page marked "Coming in Phase N" — the routes
and navigation are stable so later phases only need to fill in the pages.
