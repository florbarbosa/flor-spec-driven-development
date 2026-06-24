# Homebase Backend Conventions

> Used by `/be-review`, `/spec-reviewer`, and `/spec-builder`. These are hard rules — not suggestions.

---

## Ruby / Rails style

- `# frozen_string_literal: true` at the top of every `.rb` file
- Service objects: `ServiceName.run!` or `.call` pattern — no procedural top-level methods
- Private build methods: `build_*` prefix
- No `rescue Exception` → rescue `StandardError` or a specific error class
- `BaseController` (not `ApplicationController`) in packs
- Named keyword args on service and public interface methods

## Security

- `authenticate_account!` in every controller action — explicit `skip_before_action` with a comment if intentionally skipped
- Strong parameters with explicit `permit` lists — never `permit!`
- No raw SQL string interpolation → use `?` placeholders or Arel
- No sensitive data in logs or error messages

## Database

- Always reversible migrations (`def change` or `def up` / `def down` pair)
- No column default changes on large tables without a multi-step migration strategy
- Index all FK columns and query-critical columns
- No N+1 queries → use `includes` / `preload` / `eager_load`
- Scopes must not have side effects

## Packwerk — cross-pack rules

> These are Critical violations. PRs with these are blocked.

| Rule | Severity |
|------|----------|
| No `belongs_to` / `has_one` / `has_many` to models in another pack | Critical |
| No FK constraints between packs in migrations | Critical |
| No raw SQL joining tables from different packs | Critical |
| No `ApplicationRecord.transaction` across pack boundaries | High |
| Cross-pack references use UUID (not integer), no `_uuid` suffix | Medium |

## Public interface rules (`packs/**/app/public/**`)

| Rule | Severity |
|------|----------|
| Only class methods — no instance methods in `PublicInterface` | High |
| All parameters are named keyword args | High |
| All parameters are primitives (String, Integer, Boolean, Hash) — no AR models | Critical |
| Return values are DTOs, not AR models | Critical |
| DTOs under `packs/<pack>/app/public/<pack>/dtos/`, named with `Dto` suffix | Medium |
| DTOs implemented as `Data.define(...)` | Low |
| No factory calls for models outside the current pack in tests | Medium |

## Table design

| Rule | Severity |
|------|----------|
| New table name prefixed with domain/pack name | High |
| All tables and columns have comments | High / Medium |
| New tables use `id: :uuid` (UUIDv4 PK) | High |
| Boolean columns: `null: false` + explicit default | High |
| No polymorphic associations or FK constraints to other-pack tables | Critical |
| No cascade deletes across pack boundaries | High |
| Enumerations use native Postgres `ENUM` type — not integer or string | High |
| No `ActiveRecord::Enum` (`enum` method) in models | High |
| No database triggers | High |
| Soft deletion uses `Archivable` concern + `archived_at datetime` with index | Medium |
| Timestamps stored as `datetime` (not `timestamp with time zone`) | Medium |
| Pack models set explicit `self.table_name` | Medium |

## Testing (RSpec)

- `sign_in_stytch` or `sign_in_hub` for auth in request specs
- No `allow_any_instance_of`
- FactoryBot for fixtures — no hand-built hashes
- Request specs for controllers — not controller specs
- Coverage: happy path + main error branches + permission edge cases
- Descriptive `describe` / `context` / `it` blocks — read like English sentences
