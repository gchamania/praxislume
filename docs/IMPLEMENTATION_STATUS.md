# PraxisLume Implementation Status

Last inspected: 2026-06-22

## Repository State

PraxisLume is an initialized Git repository with a runnable foundation for v0.1 plus light v0.2, and the Supabase migration/RLS foundation has now been executed locally.

- Git repository: initialized in `C:\codex_experiments\PraxisLume`.
- Git remote: `origin` points to `https://github.com/gchamania/praxislume.git`.
- Current implementation branch: `codex/supabase-rls-verification`, based on `origin/surgmuster`.
- Docs: canonical docs are populated and duplicate `docs/PraxisLume_*.md` files have been removed.
- Flutter app: `apps/praxislume_app` has a Riverpod plus `go_router` MVP shell, web runner, widget tests, and successful web build from the foundation pass.
- Backend API: `services/api` has a Fastify TypeScript API with health, readiness, protected generation routes, compliance review, config validation, request envelopes, fake provider, and tests.
- Contracts: `packages/contracts` has shared Zod schemas and tests.
- Supabase: `supabase` has local config, initial migration, seed data, logo storage policies, and an executable RLS verification script.
- Supabase CLI: pinned as a root npm dev dependency; use `npx.cmd supabase ...` or the root npm scripts on Windows.
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
- `scripts/run_supabase_rls_checks.ps1`

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
- Added Supabase CLI as a root dev dependency for reproducible local database work.
- Added shared Zod contracts for campaign generation, content status/category, compliance, envelopes, and patient-data guard.
- Added Fastify API with health, readiness, generation, and compliance endpoints.
- Added fake provider and rules-first compliance review.
- Added Supabase migration for MVP tables, constraints, indexes, triggers, RLS policies, logo storage bucket policy scaffold, and seed specialties.
- Fixed Supabase authenticated-role grants so RLS policies are actually evaluated for client CRUD.
- Fixed logo storage policies to qualify `storage.objects.name` in folder ownership checks.
- Expanded `supabase/tests/rls_cross_clinic.sql` to verify cross-clinic read/update denial for campaigns and logo objects.
- Added `scripts/run_supabase_rls_checks.ps1` and root npm scripts for Supabase status/reset/RLS checks.
- Added Flutter MVP/light v0.2 app shell, deterministic brand preview, and widget tests from the foundation pass.
- Added CI workflow for Node and Flutter checks.

## In Progress

- Persistence integration between Flutter, API, and Supabase is the next major step.
- API generation logs need to be written to Supabase instead of the current in-memory foundation.
- Brand logo upload needs live Supabase Storage wiring from Flutter.

## Blocked

- No active Supabase migration/RLS blocker after Docker Desktop and the local npm Supabase CLI are available.
- Local Supabase still depends on Docker Desktop. The first Windows startup can take several minutes while images are pulled and may need a rerun after Docker settles.

## Next Recommended Codex Agents

1. PL-10/PL-11 integration - Supabase-backed Flutter onboarding and campaign CRUD
   - Replace in-memory Flutter state with repositories that call Supabase under RLS.
   - Preserve the existing widget tests and add repository tests.

2. PL-12/PL-13 integration - persistent AI logs and quotas
   - Connect API generation routes to Supabase.
   - Persist `ai_generation_logs`, `usage_credits`, and compliance reviews.
   - Keep the fake provider as the default local provider.

3. PL-20 integration - live brand kit storage
   - Wire brand kit CRUD to Supabase.
   - Add logo upload to the `clinic-logos` bucket using clinic-owned paths.

4. PL-100 - QA hardening
   - Add end-to-end smoke testing after Supabase-backed repositories are available.
   - Verify no service-role keys or provider secrets are exposed to Flutter.

## Verification Results

Current branch fresh verification:

- `npx.cmd supabase --version` returned `2.107.0`.
- `npx.cmd supabase start` started the local stack after Docker images were cached.
- `npx.cmd supabase db reset` exited 0 and applied `202606220001_initial_mvp_schema.sql` plus `supabase/seed.sql`.
- `npm.cmd run supabase:test:rls` exited 0 and verified campaign plus logo storage cross-clinic isolation.
- `npm.cmd run supabase:status` exited 0 and returned local service endpoints. It also prints local development keys; do not copy those into docs, Flutter, or committed files.

Previous foundation verification from the bootstrap pass:

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd test`
- `npm.cmd run build`
- `dart format --set-exit-if-changed .` in `apps/praxislume_app`
- `flutter analyze` in `apps/praxislume_app`
- `flutter test` in `apps/praxislume_app`
- `flutter build web` in `apps/praxislume_app`
- `npm.cmd run docs:check`
- `powershell -ExecutionPolicy Bypass -File scripts/run_all_checks.ps1`
- `npm.cmd audit --omit=dev` found 0 production vulnerabilities
