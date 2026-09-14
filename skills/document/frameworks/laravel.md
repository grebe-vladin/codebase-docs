# Laravel

- **Routes**: `routes/api.php`, `routes/web.php`, `routes/*.php` — `Route::get|post|…('path', [Controller::class, 'method'])`, `Route::resource/apiResource`, groups with `prefix`/`middleware`; version prefixes; `php artisan route:list` gives the full table (run it if the app boots).
- **Handler → logic**: controller method → form request (`app/Http/Requests`, validation + `authorize()`) → service/action class or Eloquent directly → resource (`app/Http/Resources`) for the response shape.
- **Data model**: Eloquent models in `app/Models` (fillable, casts, relations), migrations in `database/migrations`, factories/seeders.
- **Background**: jobs in `app/Jobs` (queued via `dispatch`), scheduled commands in `app/Console/Kernel.php` or `routes/console.php`, listeners in `app/Listeners`, notifications, Horizon config.
- **Config**: `config/*.php` reading `env('KEY')`; `.env.example` is the inventory of keys; never `env()` outside config.
- **Auth & policies**: middleware (`auth:sanctum`, `can:`), policies in `app/Policies`, gates in `AuthServiceProvider`.
- **Tests**: `tests/Feature`, `tests/Unit` (PHPUnit or Pest).
- **Dependencies**: `composer.json` + `vendor/composer/installed.json`; `deps-report.mjs` resolves `use` statements to packages through PSR-4.
