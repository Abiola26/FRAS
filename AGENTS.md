# AGENTS.md

## Layout

Three independent packages — no monorepo tooling, no CI, no pre-commit hooks:

- `backend/` — FastAPI app. Entry point `main.py`; route handlers in `app/routers/`; SQLAlchemy models in `app/models.py`. Runs on Windows (PowerShell).
- `frontend/` — React 18 + Vite + MUI dashboard. Plain JavaScript, no TypeScript/typecheck step.
- `mobile/` — Expo / React Native. Talks to the same backend API; unrelated to `frontend/`.

## Backend commands

Always run from `backend/`: settings load `.env` relative to CWD, and the SQLite fallback writes `./fleet.db`.

```powershell
.\venv\Scripts\Activate        # venv exists locally (gitignored)
python create_tables.py        # schema init via Base.metadata.create_all — run before first launch
python create_admin.py         # seeds admin user (admin / admin123); requires tables to exist
python start.py                # verifies .env + deps, starts uvicorn main:app --reload on :8000
```

- `start.py` exits early if `backend/.env` is missing — copy `.env.example` → `.env` first.
- `requirements.txt` is fully unpinned. Python 3.10+ required (`app/config.py` uses `X | Y` unions).
- Alembic is configured (`alembic.ini` → `migrations/`) but the documented setup path is `create_tables.py`; there is only one initial migration. Don't assume migrations are part of the normal workflow.

### Tests

pytest is **not** in `requirements.txt` (install it into the venv first). Tests use in-memory SQLite with `TESTING=true` set in `tests/conftest.py` — no Postgres or `.env` needed:

```powershell
pip install pytest
python -m pytest tests/ -x              # all tests
python -m pytest tests/test_auth.py -k <name>   # single test
```

**Critical**: `conftest.py` must patch **three globals** so the maintenance-mode middleware (`main.SessionLocal`), lifespan `create_all` (`main.engine`), and `utils/common.py`'s `get_system_config()` (`utils.common.SessionLocal`) all hit the test DB. If you add any code that opens `SessionLocal()` outside the `get_db` dependency, you must also patch that reference in `conftest.py` or the test will fail with a Postgres connection error.

## Frontend / mobile

```powershell
cd frontend && npm run dev      # :5173
cd frontend && npm run lint     # eslint 9 — the only check available
npx expo start                  # from mobile/
```

- Frontend API URL: `VITE_API_URL` env var, else hardcodes `http://localhost:8000` (`src/services/api.js`).
- Mobile API URL is hardcoded in `mobile/src/config/api.js` (currently a developer LAN IP, port 8000). `localhost` will not work from an Android emulator or physical device — must point at the host's IP.
- `eslint.config.js` uses inline `plugins` for `eslint-plugin-react-hooks` v5.2.0 (the `.configs.flat.recommended` export doesn't exist in this version).

## Gotchas

- Config defaults silently to SQLite (`app/config.py`) even though `.env.example` targets Postgres — check which DB you're actually hitting before debugging data issues.
- CORS allows only `localhost:3000` and `localhost:5173` unless `ALLOWED_ORIGINS` is set.
- Admin-only endpoints (bulk upload, record deletion, user management) are enforced by role dependencies; regular users get 403s there.
- Root-level backend scripts (`setup_database.py`, `add_sample_data.py`, `fix_db.py`, `check_users.py`) and text files (`debug_output.txt`, `error_log.txt`, `routes.txt`) are one-off maintenance/debug artifacts, not part of the app.

## Docs

`PROJECT_OVERVIEW.md` (architecture, endpoint list, data flow), `backend/ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md` (original setup log).
