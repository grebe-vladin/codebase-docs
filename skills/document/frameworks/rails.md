# Ruby on Rails

- **Routes**: `config/routes.rb` (`resources`, `namespace`, `scope`, custom `get/post`); `bin/rails routes` prints the full table when the app boots.
- **Handler → logic**: controller action → strong params → model / service object (`app/services`) → serializer or Jbuilder view.
- **Data model**: `app/models`, `db/schema.rb` (authoritative), `db/migrate`.
- **Background**: ActiveJob classes in `app/jobs` (Sidekiq/Resque/GoodJob), `config/sidekiq.yml`/`schedule.yml`, ActionMailer, callbacks in models.
- **Config**: `config/credentials`, `ENV[...]`, `config/*.yml`, initializers.
- **Auth**: `before_action :authenticate_user!`, Pundit/CanCanCan policies.
- **Tests**: `spec/` (RSpec) or `test/`.
- **Dependencies**: `Gemfile.lock` — not yet covered by `deps-report.mjs`; use `bundle outdated` and `bundle audit` by hand and paste the result.
