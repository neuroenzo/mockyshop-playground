# AGENTS.md

## Проект

Тесты для **MockyShop** — FastAPI + SQLAlchemy async + PostgreSQL.
Приложение подключено как editable dependency через `uv` из `../../mockyshop/backend`.

## Быстрый старт

```bash
uv sync
uv run python -m pytest -v                     # все тесты
uv run python -m pytest -v api/auth/test_registration.py   # один файл
uv run python -m pytest -v -k "test_login"     # фильтр по имени
```

## Технические ограничения

- `DATABASE_URL` указывает на `mockyshop_db` в контейнере PostgreSQL (postgres:18, порт 5434)
- Тестовый `SECRET_KEY` — длинная строка (>=32 байт для PyJWT)
- Каждый тест получает чистую БД: `TRUNCATE TABLE ... CASCADE` после каждого теста
- Удалён `aiosqlite` — тесты работают только через PostgreSQL (asyncpg)

## Структура тестов

```
api/
├── conftest.py               # глобальные fixtures (db_session, async_client, setup_db, cleanup_tables)
├── factories/user_factory.py # UserFactory.create(db, **overrides) -> User
└── auth/
    ├── conftest.py            # auth-specific fixtures (buyer_user, admin_token, ...)
    ├── test_registration.py   # POST /users/ — 8 сценариев
    ├── test_authentication.py # POST /users/token, JWT — 8 сценариев
    └── test_authorization.py  # RBAC, 401/403 — 11 сценариев, parametrize
```

## Ключевые правила

- Рабочие папки — каталоги. Не создавать как пакеты с __init__.py.
- **Все тесты асинхронные** — `async def test_...`
- **Клиент:** `httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver")`
- **Fixtures:** `db_session` (PostgreSQL, fresh engine per test, NullPool), `async_client` (с переопределённой БД)
- **Изоляция:** `cleanup_tables` (autouse) — `TRUNCATE TABLE ... CASCADE` после каждого теста
- **Setup сессии:** `setup_db` (session-scoped autouse) — `Base.metadata.create_all` + начальная очистка
- **Factory вместо fixture цепочек:** `await UserFactory.create(db, role="seller", ...)`
- **`:parametrize:`** для матричных сценариев (роль × статус × endpoint)
- **Проверять:** статус-код, структура (Pydantic response_model), 422, 401/403, ключевые поля
- **Тестовые данные:** `Faker` для генерации email, `hypothesis` для property-based (по необходимости)
- **PostgreSQL-specific:** `TSVECTOR` на `Product` — все таблицы создаются (больше не нужно ограничение `AUTH_TABLES`)

## Команды

```bash
uv add --dev <pkg>           # добавить dev-зависимость
uv lock                       # зафиксировать версии
```

## Зависимости от БД

- **Хост:** localhost:5434
- **БД:** mockyshop_db
- **Пользователь:** postgres / password
- **Драйвер:** asyncpg
- **URL:** `postgresql+asyncpg://postgres:password@localhost:5434/mockyshop_db`
