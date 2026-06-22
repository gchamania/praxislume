# PraxisLume Implementation Status

Last inspected: 2026-06-22

## Repository State

PraxisLume is now an initialized Git repository with a runnable foundation for v0.1 plus light v0.2.

- Git repository: initialized in `C:\codex_experiments\PraxisLume`.
- Git remote: `origin` points to `https://github.com/gchamania/praxislume.git`.
- Git branch: `codex/bootstrap-v0-1-v0-2`, based on `origin/surgmuster`.
- Docs: canonical docs are populated and duplicate `docs/PraxisLume_*.md` files have been removed.
- Flutter app: `apps/praxislume_app` has a Riverpod plus `go_router` MVP shell, web runner, widget tests, and successful web build.
- Backend API: `services/api` has a Fastify TypeScript API with health, readiness, protected generation routes, compliance review, config validation, request envelopes, fake provider, and tests.
- Contracts: `packages/contracts` has shared Zod schemas and tests.
- Supabase: `supabase` has local config, initial migration, seed data, storage policy scaffold, and an RLS verification SQL script.
- CI/scripts: GitHub Actions workflow and local PowerShell verification scripts exist.

## Existing Files

Canonical docs:

- `docs/SOURCE_OF_TRUTH.md`
- `docs/ARCHITECTURE.md`
- `docs/CURRENT_RELEASE.md`
- `docs/DECISIONS.md`
- `docs/CODEX_AGENT_PROMPTS.md`
- `docs/SETUP.md`
- `docs/DATABASE.md`
- `docs/API.md`
- `docs/RELEASE_TEST_PLAN_v0_1_v0_2.md`
- `docs/IMPLEMENTATION_STATUS.md`

Foundation:

- `README.md`
- `AGENTS.md`
- `.editorconfig`
- `.env.example`
- `.gitignore`
- `package.json`
- `package-lock.json`
- `.github/workflows/ci.yml`
- `scripts/run_all_checks.ps1`
- `scripts/verify_docs.ps1`

Flutter:

- `apps/praxislume_app/pubspec.yaml`
- `apps/praxislume_app/pubspec.lock`
- `apps/praxislume_app/analysis_options.yaml`
- `apps/praxislume_app/web/index.html`
- `apps/praxislume_app/web/manifest.json`
- `apps/praxislume_app/lib/main.dart`
- `apps/praxislume_app/test/app_test.dart`

API and contracts:

- `packages/contracts/src/index.ts`
- `packages/contracts/tests/contracts.test.ts`
- `services/api/src/app.ts`
- `services/api/src/auth.ts`
- `services/api/src/compliance.ts`
- `services/api/src/config.ts`
- `services/api/src/envelope.ts`
- `services/api/src/fakeProvider.ts`
- `services/api/src/generationLog.ts`
- `services/api/src/index.ts`
- `services/api/tests/app.test.ts`

Supabase:

- `supabase/config.toml`
- `supabase/migrations/202606220001_initial_mvp_schema.sql`
- `supabase/seed.sql`
- `supabase/tests/rls_cross_clinic.sql`

Assets:

- `Screen_inspirations/*.png`

## Missing Files

No required canonical docs are empty or missing.

Known missing or deferred implementation areas:

- Supabase CLI is not installed on PATH, so migrations and RLS SQL have not been executed locally.
- Flutter native mobile runner folders such as `android/` and `ios/` have not been generated yet; current runner support is web.
- Flutter uses an in-memory MVP repository for tests and prototype flow; full Supabase CRUD wiring is the next integration step.
- API generation logging is implemented as an in-memory service for the API foundation; persistence to `ai_generation_logs` is the next backend/database integration step.
- Real LLM providers are deferred behind the existing fake-provider adapter.
- Production deployment, monitoring, and staging secrets are not configured.

## Current Version Target

Implemented target: Foundation v0.0, MVP v0.1 prototype, and light v0.2 brand kit foundation.

Still enforced:

- PraxisLume is a Doctor Growth OS, not a Canva clone or generic scheduler.
- No avatar, AI video, social publishing, CRM, or diagnosis/treatment workflow is included.
- AI calls go through backend API contracts; Flutter does not contain provider keys.
- Patient-identifiable generation input is rejected by shared/API guards.
- Visual output remains deterministic; v0.2 includes a brand preview, not a design canvas.

## Completed

- Initialized Git repository.
- Canonicalized docs and removed prefixed duplicate docs.
- Populated architecture, release, decisions, setup, database, API, and release-test docs.
- Copied the agent contract into root `AGENTS.md`.
- Added root npm workspace and verification scripts.
- Added shared Zod contracts for campaign generation, content status/category, compliance, envelopes, and patient-data guard.
- Added Fastify API with:
  - `GET /health`
  - `GET /ready`
  - `POST /v1/generations/campaign-plan`
  - `POST /v1/generations/content-item-caption`
  - `POST /v1/generations/reel-script`
  - `POST /v1/generations/tone-rewrite`
  - `POST /v1/compliance/review`
- Added fake provider and rules-first compliance review.
- Added API tests for health/readiness, auth rejection, fake campaign generation, patient-data rejection, and unsafe-claim flags.
- Added Supabase migration for MVP tables, constraints, indexes, triggers, RLS policies, logo storage bucket policy scaffold, seed specialties, and RLS verification SQL.
- Added Flutter MVP/light v0.2 app shell with:
  - sign-in/demo session gate
  - onboarding validation
  - dashboard
  - 30-day campaign generation prototype
  - calendar list
  - content item edit/save/copy package
  - brand kit edit/save
  - deterministic brand preview
  - settings/sign out
- Added Flutter web runner and branded web metadata.
- Added Flutter widget tests for session gate, onboarding validation, campaign generation/edit/copy, and brand kit preview.
- Added CI workflow for Node and Flutter checks.

## In Progress

- Supabase migration execution and RLS verification are pending CLI installation.
- Persistence integration between Flutter, API, and Supabase is the next major step.
- API generation logs need to be written to Supabase instead of the current in-memory foundation.
- Brand logo upload needs live Supabase Storage wiring.

## Blocked

- Supabase verification is blocked because `supabase --version` fails with `CommandNotFoundException`.
- Local database smoke testing is blocked until Supabase CLI and local services are available.

## Next Recommended Codex Agents

1. PL-02 follow-up - Supabase execution and RLS verification
   - Install or expose Supabase CLI.
   - Run `supabase db reset`.
   - Run `supabase/tests/rls_cross_clinic.sql`.
   - Fix any migration or RLS issues found against a live local database.

2. PL-10/PL-11 integration - Supabase-backed Flutter onboarding and campaign CRUD
   - Replace in-memory Flutter state with repositories that call Supabase under RLS.
   - Preserve the existing widget tests and add repository tests.

3. PL-12/PL-13 integration - persistent AI logs and quotas
   - Connect API generation routes to Supabase.
   - Persist `ai_generation_logs`, `usage_credits`, and compliance reviews.
   - Keep the fake provider as the default local provider.

4. PL-20 integration - live brand kit storage
   - Wire brand kit CRUD to Supabase.
   - Add logo upload to the `clinic-logos` bucket using clinic-owned paths.

5. PL-100 - QA hardening
   - Add end-to-end smoke testing after Supabase is available.
   - Verify no service-role keys or provider secrets are exposed to Flutter.

## Verification Results

Passed:

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `dart format --set-exit-if-changed .` in `apps/praxislume_app`
- `flutter analyze` in `apps/praxislume_app`
- `flutter test` in `apps/praxislume_app` with 4 widget tests passing
- `flutter build web` in `apps/praxislume_app`
- `npm.cmd run docs:check`
- `powershell -ExecutionPolicy Bypass -File scripts/run_all_checks.ps1`
- `npm.cmd audit --omit=dev` found 0 production vulnerabilities

Not run successfully:

- `supabase --version` failed because Supabase CLI is not installed on PATH.
- Supabase migrations/RLS tests were not executed against a live database.
