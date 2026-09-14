# Django (and Django REST Framework)

- **Routes**: `urls.py` files chained with `include()`; `path()`/`re_path()`; DRF `DefaultRouter().register(prefix, ViewSet)` expands to list/detail routes — spell them out in the API table.
- **Handler → logic**: view function / `APIView` / `ViewSet` method → serializer (`serializers.py`, validation) → model manager/queryset → services module if the project has one.
- **Data model**: `models.py` per app, `migrations/` per app; `Meta` options and custom managers matter.
- **Background**: Celery tasks (`tasks.py`, `@shared_task`), `celery beat` schedule in settings, management commands in `management/commands`, signals in `signals.py`.
- **Config**: `settings.py` (or `settings/*.py` per environment) reading `os.environ`/`django-environ`; `INSTALLED_APPS`, `MIDDLEWARE`, `REST_FRAMEWORK` defaults (auth classes, throttling).
- **Auth & permissions**: DRF `permission_classes`, `authentication_classes`, Django `@login_required`/`@permission_required`; note views with `AllowAny`.
- **Tests**: `tests.py`/`tests/` per app (pytest-django or unittest).
- **Dependencies**: `requirements*.txt`, `pyproject.toml`, `Pipfile`; installed versions come from the active virtualenv (`.venv`).
