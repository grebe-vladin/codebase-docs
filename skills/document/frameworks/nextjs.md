# Next.js

- **Routes**: App Router `app/**/page.tsx`, `layout.tsx`, `route.ts` (API handlers export `GET/POST…`), `middleware.ts`; Pages Router `pages/**`, `pages/api/**`. Route groups `(name)` and dynamic `[id]` segments.
- **Handler → logic**: server components and server actions (`"use server"`) call the API or the DB directly; client components (`"use client"`) call through hooks (`react-query`, SWR, fetch wrappers in `lib/api/*`).
- **Data model**: none of its own unless the app owns a DB (Prisma/Drizzle in the same repo) — then it is the backend too.
- **Background**: none in-process; look for `cron` config on the host (Vercel `vercel.json` crons) and route handlers they call.
- **Config**: `NEXT_PUBLIC_*` (exposed to the browser) vs server-only env; `next.config.*` rewrites/redirects/headers.
- **Auth**: `middleware.ts` matchers, NextAuth/Auth.js config, role checks inside layouts/pages.
- **Tests**: `__tests__/`, `*.test.tsx`, Playwright/Cypress under `e2e/`.
