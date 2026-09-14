# Discovery

Goal: a **module map** — everything the module is, across every repo — written to `<scratchpad>/map-<module>.md`. Subagents locate; you confirm by reading the files they name. A claim that reaches the document must trace to a file you opened.

Dispatch one Explore agent per repo in parallel, "very thorough", asking for file paths with line numbers. Search by **name** (folder, file, class, route, feature flag) and by **wire** (the endpoint paths the module serves, grepped in every other repo).

## Frameworks

Detect per repo, then load the matching note from [`frameworks/`](frameworks/) before dispatching the Explore agent — it says where routes, handlers, models, background work, config and tests live for that stack:

| Signal | Note |
|---|---|
| `@nestjs/core` in package.json | `frameworks/nestjs.md` |
| `next` in package.json | `frameworks/nextjs.md` |
| `express`, `fastify`, `koa` in package.json | `frameworks/express.md` |
| `laravel/framework` in composer.json | `frameworks/laravel.md` |
| `django` in requirements/pyproject | `frameworks/django.md` |
| `fastapi` in requirements/pyproject | `frameworks/fastapi.md` |
| `Gemfile` with `rails` | `frameworks/rails.md` |
| `pom.xml`/`build.gradle` with spring-boot | `frameworks/spring.md` |

Anything else: answer the note's six questions yourself from the repo's README and entry point, and say in the report that the stack had no note.

## Backend (NestJS or similar)

- The module folder(s): `*.module.ts` and what it imports, provides, exports.
- Controllers → every route: method, path, guards/roles, request DTO, response shape.
- Services → what each does, what it calls: repositories, other modules, external APIs, queues, events.
- Persistence: entities/schemas (TypeORM, Prisma, Mongoose), fields, relations, migrations touching them.
- Background work: queue processors, cron jobs, event listeners, websocket gateways.
- Config: every env key read (`process.env.X`, `ConfigService.get('X')`).
- Tests that exist for the module.

## Frontend (Next.js or similar)

- Routes/pages/layouts of the module (`app/` or `pages/`), middleware that gates them.
- API calls that hit the module's endpoints: fetch/axios/react-query/server actions — match by path string.
- Components, hooks, stores, forms and their validation schemas.
- Auth/role gating on those screens; env keys (`NEXT_PUBLIC_*`).

## Shared

Type packages, generated API clients, OpenAPI specs, shared validation schemas.

## Wire matching

Build the table `endpoint ↔ frontend caller`. An endpoint with no caller is "no UI caller (used by <X> / unused)". A frontend call with no handler is "external" or "missing" — both go in the document.

## Dependencies

Save the module's file list per repo to `<scratchpad>/files-<repo>.txt` (every file the map names), then `node scripts/deps-report.mjs --repo <root>/<repo> --files-from <scratchpad>/files-<repo>.txt` — it extracts the packages those files import, their declared/installed/latest versions, release age and audit advisories. Runs `npm view` and the package manager's audit, so it needs network and takes a minute; `--no-registry`/`--no-audit` when offline. Keep the Markdown output for the Dependencies section.

## Security and operations legwork

While reading the module's files, note with file:line every: guard/role decorator (and every endpoint without one), validation pipe or schema (and every input without one), raw SQL / query builder string, `dangerouslySetInnerHTML` / `v-html`, file upload, `eval`/`Function`, secret read from env, outbound HTTP call and the data it sends, logger call that includes user data, try/catch that swallows errors, retry/timeout settings on queues and external calls, cron schedule, metric or health endpoint. These become the "what to watch for" and "what to monitor" sections — as findings with references, never as generic advice.

## Derive

- **User flows** (3–7, most important first): trigger → screens → requests → handlers → data → side effects → response. Each becomes a swimlane and a numbered list.
- **Architecture**: containers (repos, services, data stores, external systems) and the calls between them.
- **Data model**: entities the module owns or writes, with relations.
- **States**: any entity with a status field or state machine.
- **Why**: design reasons found in comments, ADRs, READMEs, PR descriptions, commit messages. Inferred reasons are marked as inferred in the document.
