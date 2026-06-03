# MockyShop

Full-stack e-commerce demo application.

Full-stack e-commerce demo: Next.js 16 (App Router) + FastAPI + PostgreSQL + Docker.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Backend | Python 3.13, FastAPI, SQLAlchemy 2.0 (async), Alembic |
| Database | PostgreSQL 18 |
| Auth | JWT (bcrypt), OAuth2 password flow |
| Infra | Docker Compose, Nginx |

## Quick Start

```bash
# 1. Clone
git clone <repo-url>
cd mockyshop-playground

# 2. Configure secrets (optional — defaults work for local dev)
cp .env.example backend/.env
# Edit backend/.env and set a random SECRET_KEY

# 3. Start all services
docker compose up -d --build
```

## Ports

| Port | Service | URL |
|---|---|---|
| `98` | Nginx (reverse proxy) | http://localhost:98 |
| `3003` | Next.js (direct) | http://localhost:3003 |
| `8000` | FastAPI (direct) | http://localhost:8000 |
| `5434` | PostgreSQL (host) | `localhost:5434` |

## Default Credentials

After first startup, an admin user is auto-created (configurable via `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars):

- **Email:** `admin@shop.com`
- **Password:** `admin123`

Register additional users (buyer/seller) at `/register`.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | _(required)_ | JWT signing key (set in `backend/.env`) |
| `DATABASE_URL` | `postgresql+asyncpg://postgres:password@db:5432/online_store` | DB connection |
| `ADMIN_EMAIL` | `admin@shop.com` | Auto-seeded admin email |
| `ADMIN_PASSWORD` | `admin123` | Auto-seeded admin password |
| `NEXT_PUBLIC_API_URL` | `""` (uses `/api` rewrite) | Override backend URL for dev |

## Project Structure

```
├── backend/          # FastAPI app
│   ├── app/
│   │   ├── models/   # SQLAlchemy models
│   │   ├── routers/  # API endpoints
│   │   ├── services/ # Business logic
│   │   └── schemas/  # Pydantic schemas
│   ├── migrations/   # Alembic migrations
│   └── Dockerfile
├── frontend/         # Next.js app
│   ├── src/
│   │   ├── app/          # App Router pages
│   │   ├── components/   # React components
│   │   ├── contexts/     # Auth context
│   │   ├── lib/          # API client, queries
│   │   └── types/        # TypeScript types
│   └── Dockerfile
├── nginx/            # Nginx config
└── docker-compose.yml
```

## Features

- Browse products with search, filter, sort, pagination
- Product detail page with multiple images
- Shopping cart (add/remove/update qty)
- Order flow: create → pay → ship → deliver
- Role-based auth: buyer / seller / admin
- Admin panel: user management, category CRUD
- Seller panel: product CRUD with image upload
- Responsive design (Tailwind CSS v4 / Tailstore theme)

## Development

```bash
# Rebuild after changes
docker compose up -d --build

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Apply new DB migrations (auto-run on startup)
docker compose exec backend alembic upgrade head
```


