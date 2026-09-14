# FastAPI

- **Routes**: `@app.get/post…` and `APIRouter` instances mounted with `app.include_router(router, prefix=…)`; the effective path is prefix + route; tags group them; `/docs` (Swagger) lists everything if the app runs.
- **Handler → logic**: path operation function → Pydantic request/response models (`schemas.py`) → dependency-injected services (`Depends`) → SQLAlchemy/SQLModel/Tortoise session.
- **Data model**: SQLAlchemy models (`models.py`), Alembic migrations under `alembic/versions`; Pydantic schemas are the API shape, not the DB shape — document both.
- **Background**: `BackgroundTasks`, Celery/RQ/ARQ workers, APScheduler; lifespan/startup hooks in `main.py`.
- **Config**: `pydantic-settings` `BaseSettings` classes (the field list is the env inventory), `.env` files.
- **Auth**: `Depends(get_current_user)`-style dependencies, `OAuth2PasswordBearer`, API-key headers; note routes without an auth dependency.
- **Tests**: `tests/` with `TestClient`/`httpx`.
