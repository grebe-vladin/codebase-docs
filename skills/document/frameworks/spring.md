# Spring Boot (Java/Kotlin)

- **Routes**: `@RestController` + `@RequestMapping` on the class, `@GetMapping/@PostMapping…` on methods; `server.servlet.context-path` in `application.yml`.
- **Handler → logic**: controller → `@Service` → `@Repository` (JPA) or JDBC; DTOs with `@Valid`.
- **Data model**: `@Entity` classes, Flyway/Liquibase migrations under `db/migration`.
- **Background**: `@Scheduled`, `@Async`, `@KafkaListener`/`@RabbitListener`, Spring Batch jobs.
- **Config**: `application*.yml|properties`, `@Value`, `@ConfigurationProperties` classes (the field list is the inventory).
- **Auth**: Spring Security config (`SecurityFilterChain`), `@PreAuthorize`; list endpoints permitted without auth.
- **Tests**: `src/test`, `@SpringBootTest`, `@WebMvcTest`.
- **Dependencies**: `pom.xml` / `build.gradle` — not yet covered by `deps-report.mjs`; use `mvn versions:display-dependency-updates` / `gradle dependencyUpdates` and an OWASP dependency-check by hand.
