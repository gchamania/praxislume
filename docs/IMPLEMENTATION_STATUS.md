# PraxisLume Implementation Status

Last inspected: 2026-06-23

## Repository State

PraxisLume is an initialized Git repository with a runnable foundation for v0.1 plus light v0.2, and the Supabase migration/RLS foundation has now been executed locally.

- Git repository: initialized in `C:\codex_experiments\PraxisLume`.
- Git remote: `origin` points to `https://github.com/gchamania/praxislume.git`.
- Current implementation branch: `codex/pl-ui-visual-redesign`.
- Docs: canonical docs are populated and duplicate `docs/PraxisLume_*.md` files have been removed.
- Flutter app: `apps/praxislume_app` has a Riverpod plus `go_router` MVP shell, web runner, Supabase email/password auth controls, a session-aware persistence repository, Day 2 mockup-inspired visual foundations, redesigned MVP workspace routes, widget tests, and controller tests.
- Backend API: `services/api` has a Fastify TypeScript API with health, readiness, Supabase JWT verification for protected routes, compliance review, config validation, request envelopes, fake provider, Supabase-backed generation/quota/compliance stores, and tests.
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
- `apps/praxislume_app/lib/ui/praxis_components.dart`
- `apps/praxislume_app/lib/ui/praxis_theme.dart`
- `apps/praxislume_app/test/app_test.dart`
- `apps/praxislume_app/test/praxis_controller_test.dart`

API and contracts:

- `packages/contracts/src/index.ts`
- `packages/contracts/tests/contracts.test.ts`
- `services/api/src/app.ts`
- `services/api/src/auth.ts`
- `services/api/src/complianceStore.ts`
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
- Flutter still uses an in-memory repository for demo mode and tests when no Supabase session exists.
- API Supabase persistence has adapter coverage and has passed a real local smoke test with Supabase Auth JWTs and the service-role key.
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
- Added Flutter email/password sign-in and account creation controls that call Supabase Auth directly when the app is built with Supabase dart defines.
- Added a `PraxisRepository` seam, in-memory repository, session-aware Supabase repository, and controller tests.
- Wired Flutter onboarding, brand kit edits, campaign package generation, and content item edits through repository persistence.
- Added Day 2 visual foundations under `apps/praxislume_app/lib/ui/`, including Praxis theme tokens, reusable cards/chips/stat cards, deterministic medical thumbnails, sidebar workspace shell, top bar, and coming-soon panels.
- Redesigned sign-in, sign-up, onboarding, dashboard, generate content, calendar, content library, content detail/copy, brand settings, and settings screens using the mockup direction from `Screen_inspirations`.
- Added MVP-safe placeholder routes for `/templates`, `/analytics`, and `/media-studio`; these clearly defer templates, analytics, media studio, avatar/video, and publishing scope.
- Preserved functional demo auth, onboarding validation, 30-day campaign generation, content edit/copy, and brand kit save flows through the visual redesign.
- Expanded Flutter widget coverage for redesigned auth/onboarding/workspace routes, future placeholders, copy/export, and brand kit save.
- Added API generation store adapters for daily usage reservation, quota exhaustion, patient-data rejection logging, provider success/failure logging, and Supabase `ai_generation_logs` persistence.
- Added API compliance review store adapters that persist review metadata to `content_compliance_reviews` without raw reviewed content.
- Added Supabase Auth JWT verification for non-test protected API routes, with injectable test verification.
- Added API tests for all generation endpoint log categories, quota exhaustion, patient-data blocking before quota reservation, verified user-id logging, invalid-token rejection, and compliance metadata persistence.
- Merged `codex/api-supabase-ai-logs` into `surgmuster`.
- Added explicit `service_role` grants for server-managed Supabase tables used by API persistence.
- Expanded the Supabase RLS check to verify service-role writes to `ai_generation_logs`, `usage_credits`, and `content_compliance_reviews`.
- Fixed the RLS PowerShell wrapper so SQL failures return a failing exit code.
- Updated the shared patient-data guard to ignore operational metadata such as `clinicId` and `idempotencyKey` while still rejecting patient-identifiable request content.
- Ran a PL-13 local API smoke with a real Supabase Auth user/JWT, RLS clinic insert, API generation, blocked patient-data generation, compliance review, and Supabase row verification.
- Added CI workflow for Node and Flutter checks.

## In Progress

- Flutter Supabase persistence still needs a real local smoke test with a Supabase Auth user.
- Brand logo upload needs live Supabase Storage wiring from Flutter.
- Day 2 visual QA has route-level browser smoke coverage; full screenshot comparison remains manual because the in-app browser screenshot API timed out against Flutter CanvasKit.

## Blocked

- No active Supabase migration/RLS blocker after Docker Desktop and the local npm Supabase CLI are available.
- Local Supabase still depends on Docker Desktop. The first Windows startup can take several minutes while images are pulled and may need a rerun after Docker settles.

## Next Recommended Codex Agents

1. PL-UI-QA - visual QA and responsive polish
   - Manually inspect the running web build at desktop and narrow mobile sizes.
   - Compare primary MVP screens against `Screen_inspirations`.
   - Capture screenshots outside the current in-app browser path if needed.

2. PL-11 hardening - Flutter local Supabase smoke
   - Create a local Supabase Auth user.
   - Sign in through Flutter with dart defines.
   - Verify onboarding, brand kit save, campaign generation, and content item edit persist across restart.

3. PL-20 integration - live brand kit storage
   - Wire brand kit CRUD to Supabase.
   - Add logo upload to the `clinic-logos` bucket using clinic-owned paths.

4. PL-100 - QA hardening
   - Add end-to-end smoke testing after Supabase-backed repositories are available.
   - Verify no service-role keys or provider secrets are exposed to Flutter.

## Verification Results

Current Day 2 visual redesign verification on `codex/pl-ui-visual-redesign`:

- `dart format --set-exit-if-changed .` in `apps/praxislume_app` exited 0.
- `flutter analyze` in `apps/praxislume_app` exited 0 with no issues.
- `flutter test` in `apps/praxislume_app` exited 0 with 10 tests passing.
- `flutter build web` in `apps/praxislume_app` exited 0 and built `build\web`; Flutter printed a non-fatal Cupertino icon font warning plus Material icon tree-shaking output.
- Local static web server for `build\web` responded 200 at `http://127.0.0.1:8085`.
- Browser route smoke for `/signin`, `/signup`, `/onboarding`, `/dashboard`, `/generate`, `/calendar`, `/library`, `/brand`, `/settings`, `/templates`, `/analytics`, and `/media-studio` loaded the Flutter view with page title `PraxisLume` and 0 console errors after Flutter initialization.
- In-app browser screenshot capture timed out against the CanvasKit page, so visual screenshots still need manual capture or a different screenshot path.

Previous `surgmuster` verification after Agent 3 merge and PL-13 smoke hardening:

- `npm.cmd run test:contracts` exited 0 with 6 contract tests passing.
- `npm.cmd run test:api` exited 0 with 11 API tests passing.
- `npm.cmd run lint` exited 0.
- `npm.cmd run typecheck` exited 0.
- `npm.cmd test` exited 0 with 6 contract tests and 11 API tests passing.
- `npm.cmd run docs:check` exited 0.
- `npm.cmd run build` exited 0.
- `npm.cmd run supabase:test:rls` exited 0 after verifying service-role writes plus cross-clinic campaign/logo isolation.
- PL-13 local API smoke exited 0 after creating a real local Supabase Auth user, inserting a clinic through RLS with the user JWT, calling protected API generation/compliance endpoints, and verifying `ai_generation_logs`, `usage_credits`, and `content_compliance_reviews` rows.

Previous Flutter and Supabase verification from the Agent 2 persistence pass:

- `dart format --set-exit-if-changed .` in `apps/praxislume_app` exited 0 after formatting changes were applied.
- `flutter analyze` in `apps/praxislume_app` exited 0 with no issues.
- `flutter test` in `apps/praxislume_app` exited 0 with 9 tests passing.
- `flutter build web` in `apps/praxislume_app` exited 0 and built `build\web`.
- `npm.cmd run supabase:test:rls` exited 0 and verified campaign plus logo storage cross-clinic isolation.
- `npx.cmd supabase --version` returned `2.107.0`.
- `npx.cmd supabase start` started the local stack after Docker images were cached.
- `npx.cmd supabase db reset` exited 0 and applied `202606220001_initial_mvp_schema.sql` plus `supabase/seed.sql`.
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
