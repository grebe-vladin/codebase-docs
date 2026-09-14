# Express / Fastify / Koa (plain Node)

- **Routes**: `app.get/post…`, `router.*` in `routes/*`; mounted with `app.use('/prefix', router)`; Fastify `fastify.route`/plugins with `prefix`. Middleware order in `app.js`/`server.js` decides auth and parsing.
- **Handler → logic**: route callback → controller → service → DB client (Knex, Prisma, Sequelize, Mongoose, raw driver).
- **Data model**: ORM models or migration files; with raw SQL, the `CREATE TABLE` statements are the model.
- **Background**: Bull/BullMQ/Agenda workers, `node-cron`, separate worker entry points in `package.json` scripts.
- **Config**: `process.env.*` (often through `dotenv` + a `config/` module); `.env.example`.
- **Auth**: middleware such as `passport`, `express-jwt`, custom `requireAuth`; list routes mounted before the auth middleware.
- **Tests**: `*.test.js`, `supertest` suites.
