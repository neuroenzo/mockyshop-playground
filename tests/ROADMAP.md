## Tests Roadmap

### Current State

UI e2e tests for authorization (pytest + Playwright):
- Parameterized login for 3 roles (admin, buyer, seller)
- Page Object Model (LoginPage, MainPage)
- Component Object Model (NavbarComponent)
- Credentials from `.env` via pydantic-settings
- Allure reporting with screenshots on failure

### Desired Future

- **API/integration tests**
- **Load / performance tests**
- **CI pipeline** — Jenkins: lint → unit → e2e
- **Accessibility checks** — axe-core via Playwright
- **Ephemeral test DB** — Docker Compose for isolated test runs
