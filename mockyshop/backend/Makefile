dev:
	uvicorn app.main:app --port 8000 --reload

lint:
	uv run ruff check .

format:
	uv run ruff format .

check: lint format

fix:
	uv run ruff check --fix .

fix-unsafe:
	uv run ruff check --fix --unsafe-fixes .

e2e:
	uv run pytest -v ../../tests/e2e -m e2e