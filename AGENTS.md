# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: FastAPI service. Key modules: `app/main.py` (app + routers), `app/models.py` (SQLAlchemy), `app/schemas.py` (Pydantic), `app/routers/*.py` (feature routes), `app/database.py` (engine/session).
- `frontend/`: React (CRA). App code in `src/` (`components/`, `views/`, `services/`), static assets in `public/`.
- `docker-compose.yml`: Local dev stack (Postgres, backend, frontend). Volumes mount source for live reload.

## Build, Test, and Development Commands
- Run full stack: `docker-compose up --build` (then visit `http://localhost:3003`).
- Stop stack: `docker-compose down` (add `-v` to remove DB volume).
- Backend dev only: `cd backend && uvicorn app.main:app --reload` (ensure `DATABASE_URL` is set; Python 3.11).
- Frontend dev only: `cd frontend && npm start` (CRA dev server with proxy to backend).
- Frontend build: `cd frontend && npm run build` (optimized production build).

## Coding Style & Naming Conventions
- Python: PEP 8, 4-space indent, snake_case for vars/functions, PascalCase for Pydantic models and SQLAlchemy models. Organize endpoints under `app/routers/<feature>.py` and keep request/response models in `schemas.py`.
- React: Components in PascalCase (e.g., `CylinderChart.jsx`), functions/vars in camelCase, colocate styles (e.g., `App.css`). Prefer functional components and hooks.
- Imports: group stdlib, third-party, then local. Keep relative paths short and clear.

## Testing Guidelines
- Frontend: CRA test tooling available (`npm test`). Place tests next to source using `*.test.js(x)`. Aim for key view/component coverage and API hooks.
- Backend: Add pytest-based tests under `backend/tests/` using `test_*.py`. Example: `pytest -q` from `backend/` once tests are added. Target critical routers and DB access via a test database.

## Commit & Pull Request Guidelines
- Commits: concise imperative subject (≤72 chars), meaningful body when needed. Prefer Conventional Commit prefixes (`feat:`, `fix:`, `chore:`, `docs:`).
- PRs: clear description, link issues, outline testing steps, and include screenshots for UI changes. Ensure `docker-compose up --build` succeeds before requesting review.

## Security & Configuration Tips
- Secrets: configure via env vars (e.g., `DATABASE_URL`). Do not hardcode credentials.
- CORS: backend allows dev origins on ports 3000/3003; avoid relaxing for production.
- Data: local Postgres volume persists between runs; use `docker-compose down -v` to reset.
