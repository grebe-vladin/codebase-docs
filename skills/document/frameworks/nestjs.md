# NestJS

- **Routes**: `@Controller('prefix')` classes with `@Get/@Post/@Put/@Patch/@Delete('path')` methods; global prefix in `main.ts` (`app.setGlobalPrefix`); versioning via `@Version`. WebSockets: `@WebSocketGateway` + `@SubscribeMessage`.
- **Handler → logic**: controller method → injected service (constructor params) → repository/ORM. Follow the constructor injection, not the imports.
- **Data model**: TypeORM `@Entity` classes, Prisma `schema.prisma`, or Mongoose `@Schema`; migrations under `migrations/` or `prisma/migrations/`.
- **Background**: `@Processor`/`@Process` (Bull/BullMQ), `@Cron`/`@Interval` (schedule), `@OnEvent` (event emitter), `@MessagePattern` (microservices).
- **Config**: `ConfigService.get('KEY')`, `process.env.KEY`, `registerAs` config namespaces, `.env*` files, validation schema in `ConfigModule.forRoot`.
- **Guards & validation**: `@UseGuards`, `@Roles`, global `ValidationPipe`, DTOs with `class-validator`; note any handler without a guard.
- **Tests**: `*.spec.ts` beside the code, `test/*.e2e-spec.ts`.
