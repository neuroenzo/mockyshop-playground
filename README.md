### MockyShop Test Playground

MockyShop is a playground for designing, running, and evolving automated tests.

MockyShop is the **system under test**, not the main product. It provides a
realistic UI, REST API, database, authentication, user roles, and multi-step business flows so
that different testing approaches can be practised in one reproducible environment.

### What This Repository Is For

Use this project to experiment with:

- end-to-end UI tests with pytest and Playwright;
- API and integration tests;
- test architecture, fixtures, Page Objects, and test-data management;
- reports and failure artifacts with Allure;
- load and performance tests;
- accessibility checks;
- CI pipelines and isolated test environments.

The test suite is intentionally expected to grow. The current implementation covers
authorization scenarios with UI and API-assisted e2e tests. Planned areas are listed in
[`tests/ROADMAP.md`](tests/ROADMAP.md).

### System Under Test

The test environment is a small e-commerce application with enough behaviour for realistic
automation scenarios:

- buyer, seller, and administrator roles;
- registration and JWT authentication;
- product catalogue, search, filters, and pagination;
- product and category management;
- shopping cart, orders, payment, and delivery statuses;
- image uploads and role-based access control.

The application stack is:

| Layer | Technology |
|---|---|
| Test automation | pytest, Playwright, Allure |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Python 3.13, FastAPI, async SQLAlchemy 2, Alembic |
| Database | PostgreSQL 18 |
| Infrastructure | Docker Compose, Nginx |

### Repository Structure

```text
.
├── tests/
│   ├── e2e/                 # Current pytest + Playwright test suite
│   │   ├── components/      # Reusable UI components
│   │   ├── fixtures/        # pytest fixtures
│   │   ├── pages/           # Page Objects
│   │   ├── support/         # API clients, services, and report helpers
│   │   └── tests/           # Test scenarios
│   └── ROADMAP.md           # Planned test types and infrastructure
├── mockyshop/
│   ├── frontend/            # Next.js system under test
│   ├── backend/             # FastAPI system under test
│   ├── nginx/               # Reverse-proxy configuration
│   └── docker-compose.yml   # Complete local test environment
└── allure-results/          # Generated test results (when enabled)
```

### Quick Start

#### 1. Start the system under test

From the repository root:

```bash
cd mockyshop
cp .env.example backend/.env
docker compose up -d --build
```

The environment will be available at:

| Service | Address |
|---|---|
| Application through Nginx | <http://localhost:98> |
| Frontend | <http://localhost:3003> |
| API and Swagger UI | <http://localhost:8000/docs> |
| PostgreSQL | `localhost:5434` |

#### 2. Install the test dependencies

The Python project uses [uv](https://docs.astral.sh/uv/):

```bash
cd backend
uv sync --group test --group e2e
uv run playwright install chromium
```

#### 3. Prepare test users

The application automatically creates this administrator on first startup:

```text
admin@shop.com / admin123
```

The current e2e suite also expects the following users:

```text
buyer@shop.com  / buyer123
seller@shop.com / seller123
```

Create them through the registration form at <http://localhost:3003> before the first test run.
The expected addresses and passwords can be changed in `tests/e2e/.env`.

#### 4. Run the tests

From `mockyshop/backend`:

```bash
# All current e2e tests
make e2e

# The same command without Make
uv run pytest -v ../../tests/e2e -m e2e

# Run without a visible browser window
uv run pytest -v ../../tests/e2e -m e2e --headless

# Save Allure results
uv run pytest -v ../../tests/e2e -m e2e --alluredir=../../allure-results
```

The pytest configuration runs browsers in headed mode by default. Pass `--headless` when running
in CI or when the browser UI is not needed.

### Test Configuration

Test environment settings are stored in `tests/e2e/.env`:

```dotenv
SHOP_URL=localhost:3003
API_URL=localhost:8000
URL_SCHEMA=http://
ADMIN_EMAIL=admin@shop.com
ADMIN_PASSWORD=admin123
BUYER_EMAIL=buyer@shop.com
BUYER_PASSWORD=buyer123
SELLER_EMAIL=seller@shop.com
SELLER_PASSWORD=seller123
```

These credentials are intended only for the local test environment.

### Managing the Test Environment

Run these commands from `mockyshop`:

```bash
# Check container status
docker compose ps

# Follow application logs
docker compose logs -f backend frontend

# Rebuild after changing the system under test
docker compose up -d --build

# Stop the environment
docker compose down
```

Database migrations and administrator seeding run automatically when the backend container
starts.

### Current Status and Next Steps

Available now:

- UI login tests for buyer, seller, and administrator roles;
- authenticated browser sessions created through the API;
- Page Object and reusable component layers;
- screenshots and Playwright traces for failed tests;
- Allure-compatible test results.

Planned next:

- broader API and integration coverage;
- isolated test data and an ephemeral test database;
- load and performance scenarios;
- accessibility checks;
- CI pipeline for lint, integration, and e2e stages.

See [`tests/ROADMAP.md`](tests/ROADMAP.md) for the short roadmap.
