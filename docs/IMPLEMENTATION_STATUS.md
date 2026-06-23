# PraxisLume Implementation Status

Last inspected: 2026-06-23

## Repository State

PraxisLume is an initialized Git repository with a runnable foundation for v0.1 plus light v0.2, and the Supabase migration/RLS foundation has now been executed locally.

- Git repository: initialized in `C:\codex_experiments\PraxisLume`.
- Git remote: `origin` points to `https://github.com/gchamania/praxislume.git`.
- Current implementation branch: `surgmuster`.
- Docs: canonical docs are populated and duplicate `docs/PraxisLume_*.md` files have been removed.
- Flutter app: `apps/praxislume_app` has a Riverpod plus `go_router` MVP shell, web runner, Supabase email/password auth controls, a session-aware persistence repository, clean architecture folders, Day 2 mockup-inspired visual foundations, redesigned MVP workspace routes, widget tests, controller tests, and an architecture boundary test.
- Backend API: `services/api` has a Fastify TypeScript API with health, readiness, Supabase JWT verification for protected routes, compliance review, config validation, request envelopes, fake and OpenAI-compatible provider routing, Supabase-backed generation/quota/compliance stores, and tests.
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
- `docs/AI_ROUTING.md`
- `docs/RELEASE_TEST_PLAN_v0_1_v0_2.md`
- `docs/PILOT_DEMO_SCRIPT.md`
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
- `apps/praxislume_app/lib/praxis_lume.dart`
- `apps/praxislume_app/lib/application/`
- `apps/praxislume_app/lib/core/`
- `apps/praxislume_app/lib/data/`
- `apps/praxislume_app/lib/domain/`
- `apps/praxislume_app/lib/presentation/`
- `apps/praxislume_app/lib/ui/praxis_components.dart`
- `apps/praxislume_app/lib/ui/praxis_theme.dart`
- `apps/praxislume_app/test/app_test.dart`
- `apps/praxislume_app/test/architecture_test.dart`
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
- `services/api/src/generationProvider.ts`
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
- Real LLM provider credentials, staging secrets, and optional live smoke are not configured in the repository. The backend now supports OpenAI-compatible routing, while fake remains the default local provider.
- Production deployment, monitoring, and staging secrets are not configured.

## Current Version Target

Implemented target: Foundation v0.0, MVP v0.1 prototype, light v0.2 brand kit foundation, Sprint 10-12 backend live-AI routing foundation, and Flutter clean-architecture refactor.

Still enforced:

- PraxisLume is a Doctor Growth OS, not a Canva clone or generic scheduler.
- No avatar, AI video, social publishing, CRM, or diagnosis/treatment workflow is included.
- AI calls go through backend API contracts; Flutter does not contain provider keys.
- Patient-identifiable generation input is rejected by shared/API guards.
- Visual output remains deterministic; v0.2 includes a brand preview, not a design canvas.
- Live AI remains backend-only and route-gated; fake generation stays available for deterministic local/pilot smoke.

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
- Added Day 2 Sprint 4 responsive QA coverage for mobile drawer navigation and compact workspace routes.
- Fixed mobile overflows in onboarding actions, dashboard task controls, generate progress steps, and generated package actions.
- Created the Day 2 to pilot-readiness integration baseline branch `codex/pl-integration-baseline` from the pushed visual QA branch.
- Prepared the Day 2 visual QA PR path for `codex/pl-ui-qa-smoke` into `surgmuster`; automatic PR creation is blocked in this environment because the GitHub connector returned a 403.
- Reconciled the pilot-readiness sprint plan against `docs/SOURCE_OF_TRUTH.md`, `docs/CURRENT_RELEASE.md`, `docs/DECISIONS.md`, and `docs/ARCHITECTURE.md`.
- Marked Day 2 visual redesign work complete after full Flutter, API, contracts, docs, build, and Supabase RLS checks passed on the integration baseline.
- Added a Flutter local Supabase smoke test that creates a real local Auth user, persists onboarding, brand kit, generated campaign items, content edits, and verifies reload through the same repository/controller path used by the app.
- Fixed Flutter Supabase doctor specialty persistence by writing `doctor_profiles.specialty_id` from the seeded `specialties` table and reloading the joined specialty name instead of defaulting every doctor to Dermatology.
- Verified the Supabase-configured Flutter web build loads in the browser with 0 console errors on `http://127.0.0.1:8086/#/signin`.
- Added live Flutter logo upload on the Brand Settings screen using the `clinic-logos` Supabase Storage bucket and controlled `<clinic_id>/logo.<extension>` paths.
- Saved uploaded logo paths into `brand_kits.logo_path` and render private logos in brand settings/preview through short-lived signed URLs.
- Expanded the local Supabase smoke to verify owner logo upload/download, reloaded logo path persistence, and cross-clinic logo download denial.
- Added a Flutter API generation client configured by `API_BASE_URL` that sends the current Supabase access token to protected Fastify endpoints.
- Wired campaign generation through the backend API when Supabase and `API_BASE_URL` are configured, while preserving deterministic local generation for demo/no-API builds.
- Added Flutter client methods for campaign plan, caption, reel script, tone rewrite, and compliance review endpoints.
- Expanded the local Supabase smoke to call all protected API generation/compliance routes and verify `ai_generation_logs` plus `content_compliance_reviews` persistence.
- Ran Sprint 9 pilot release QA across docs, Flutter, API/contracts, Supabase RLS, backend-gated local smoke, browser startup, and Flutter secret scanning.
- Added `docs/PILOT_DEMO_SCRIPT.md`, a Windows-friendly doctor-pilot runbook for local Supabase, Fastify fake provider, Flutter web, onboarding, brand logo upload, backend-gated campaign generation, audit evidence, content edit/copy/export, and reload persistence.
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
- Added route-specific OpenAI-compatible provider support for campaign plans, captions, reel scripts, and tone rewrites.
- Added strict JSON response validation, one repair attempt, timeout/error categories, prompt version/hash logging, and returned token metadata capture when providers supply it.
- Added mocked live-provider tests for success, invalid JSON repair, unrepaired schema failure, timeout, provider error, quota exhaustion before provider calls, patient-data rejection before provider calls, and ENT/Dermatology 30-day campaign quality fixtures.
- Added `docs/AI_ROUTING.md` documenting direct provider, LiteLLM Proxy, and Vercel AI Gateway routing via `OPENAI_COMPATIBLE_BASE_URL`.
- Refactored the Flutter app out of monolithic `main.dart` into `core`, `domain`, `application`, `data`, `presentation`, and `ui` layers while preserving the existing v0.1/light v0.2 routes and behavior.
- Added `apps/praxislume_app/lib/praxis_lume.dart` as a barrel export for app modules and tests.
- Added a Flutter architecture test that keeps `main.dart` bootstrap-only and verifies the expected app layers exist.
- Fast-forward merged `codex/pl-flutter-clean-architecture` into `surgmuster`.

## In Progress

- No active feature implementation after the Flutter clean-architecture merge. Next work should be production/staging deployment setup and optional live-provider smoke with real staging secrets.
- Full screenshot comparison remains manual because the in-app browser screenshot API previously timed out against Flutter CanvasKit.

## Blocked

- No active Supabase migration/RLS blocker after Docker Desktop and the local npm Supabase CLI are available.
- Local Supabase still depends on Docker Desktop. The first Windows startup can take several minutes while images are pulled and may need a rerun after Docker settles.

## Next Recommended Codex Agents

1. Deployment setup agent
   - Prepare staging environment variables and deployment notes for Flutter web, Fastify API, Supabase, and optional OpenAI-compatible routing without committing service-role or provider secrets.

2. Live-provider smoke agent
   - Run an optional live-provider smoke behind the existing OpenAI-compatible backend adapter with real staging secrets supplied outside Git.
   - Keep fake provider as default and keep all provider keys server-only.

## Verification Results

Current Flutter clean-architecture verification on `codex/pl-flutter-clean-architecture`:

- Rebased `codex/pl-flutter-clean-architecture` onto `origin/surgmuster` after resolving a status-doc conflict between the pilot demo script pass and Sprint 10-12 AI routing notes.
- Fast-forward merged `codex/pl-flutter-clean-architecture` into `surgmuster` and pushed `surgmuster`.
- `npm.cmd run docs:check` exited 0.
- `npm.cmd run lint` exited 0.
- `npm.cmd run typecheck` exited 0.
- `npm.cmd test` exited 0 with 6 contract tests and 21 API tests passing.
- `dart format --output=none --set-exit-if-changed .` in `apps/praxislume_app` exited 0 with 0 files changed.
- `flutter analyze` in `apps/praxislume_app` exited 0 with no issues.
- `flutter test` in `apps/praxislume_app` exited 0 with 13 regular tests passing and 1 local Supabase/API smoke test skipped because dart defines were not provided.

Source-of-truth reconciliation: the Flutter clean-architecture pass changes code organization only. It preserves the v0.1 plus light v0.2 product boundary, keeps AI calls backend-gated, keeps deterministic UI output, and adds no Canva-style editor, social publishing, avatar/video generation, CRM workflow, diagnosis workflow, or patient-identifiable generation prompt surface.

Current Sprint 10-12 AI integration verification on `codex/pl-ai-s10-s12`:

- TDD red check: `npm.cmd run test:api -- --run tests/app.test.ts` initially failed because live provider envs still routed to the fake provider.
- `npm.cmd run test:api -- --run tests/app.test.ts` exited 0 with 21 API tests passing after implementation.
- `npm.cmd run docs:check` exited 0.
- `npm.cmd test` exited 0 with 6 contract tests and 21 API tests passing.
- `npm.cmd run lint` exited 0.
- `npm.cmd run typecheck` exited 0.
- `npm.cmd run build` exited 0.
- `npm.cmd run supabase:test:rls` exited 0.
- `dart format --set-exit-if-changed .` in `apps/praxislume_app` exited 0 with 0 files changed.
- `flutter analyze` in `apps/praxislume_app` exited 0 with no issues.
- `flutter test` in `apps/praxislume_app` exited 0 with 12 regular tests passing and 1 local Supabase/API smoke test skipped because dart defines were not provided.
- `flutter build web` in `apps/praxislume_app` exited 0 and built `build\web`; Flutter printed the existing non-fatal icon font warning.
- Flutter secret scan `rg -n "SUPABASE_SERVICE_ROLE_KEY|service_role|sb_secret_|sk-[A-Za-z0-9]|AIza|OPENAI_API_KEY|ANTHROPIC_API_KEY" apps\praxislume_app` returned no matches.
- Optional live-provider smoke was not run because no real OpenAI-compatible provider key/model was configured in this repository.

Source-of-truth reconciliation: Sprint 10-12 remains aligned with `docs/SOURCE_OF_TRUTH.md`. PraxisLume still uses Flutter, Supabase, Fastify, contracts, and deterministic UI output. Live AI is backend-only and route-gated; Flutter receives no provider keys or service-role keys. Patient-identifiable input is rejected before provider calls. The work adds no Canva-style editor, social publishing, avatar/video generation, CRM, diagnosis workflow, or AI image/voice/video cost surface.

Current Sprint 9 pilot release QA verification on `codex/pl-pilot-release-qa`:

- `npm.cmd run docs:check` at repo root exited 0.
- `npm.cmd run lint` at repo root exited 0.
- `npm.cmd run typecheck` at repo root exited 0.
- `npm.cmd test` at repo root exited 0 with 6 contract tests and 11 API tests passing.
- `npm.cmd run build` at repo root exited 0.
- `npm.cmd run supabase:test:rls` at repo root exited 0, including service-role server table writes plus cross-clinic campaign/logo isolation checks.
- `dart format --set-exit-if-changed .` in `apps/praxislume_app` exited 0 with 0 files changed.
- `flutter analyze` in `apps/praxislume_app` exited 0 with no issues. Flutter also printed a non-blocking notice that a newer Flutter version is available.
- `flutter test` in `apps/praxislume_app` exited 0 with 12 regular tests passing and 1 local Supabase/API smoke test skipped because dart defines were not provided.
- `flutter test test/supabase_repository_smoke_test.dart --dart-define=SUPABASE_URL=http://127.0.0.1:54321 --dart-define=SUPABASE_ANON_KEY=<local publishable key> --dart-define=API_BASE_URL=http://127.0.0.1:8787` exited 0 with 1 backend-gated smoke test passing.
- `flutter build web --dart-define=SUPABASE_URL=http://127.0.0.1:54321 --dart-define=SUPABASE_ANON_KEY=<local publishable key> --dart-define=API_BASE_URL=http://127.0.0.1:8787` exited 0 and built `build\web`.
- Browser load check for `http://127.0.0.1:8086/#/signin` returned title `PraxisLume` and 0 console errors.
- Flutter secret scan `rg -n "SUPABASE_SERVICE_ROLE_KEY|service_role|sb_secret_|sk-[A-Za-z0-9]|AIza|OPENAI_API_KEY|ANTHROPIC_API_KEY" apps\praxislume_app` returned no matches.

## Pilot Readiness Report

PraxisLume now has a credible local doctor-pilot demo path for v0.1 plus light v0.2:

- A doctor can create/sign in to a local Supabase Auth account.
- Onboarding persists doctor, clinic, specialty, services, and contact basics under RLS.
- Brand kit edits persist, including controlled logo upload/read through private Supabase Storage.
- A 30-day specialty-aware campaign can be generated through the Fastify backend with the Supabase JWT and fake provider.
- Backend generation writes `ai_generation_logs`; compliance review writes `content_compliance_reviews`.
- Campaign items persist, reload, edit, and support copy/export flows in Flutter.
- Future Templates, Analytics, and Media Studio remain placeholders only.

Remaining pilot gaps:

- Production/staging deployment, monitoring, and real environment secret management are not configured.
- Optional live-provider smoke with real staging credentials is still pending.
- Browser screenshot capture remains manual because automated screenshots previously timed out against Flutter CanvasKit.
- The current app runner is Flutter web; native mobile runner folders remain ungenerated.

Source-of-truth reconciliation: Sprint 9 remains aligned with `docs/SOURCE_OF_TRUTH.md`. PraxisLume is still a Doctor Growth OS, not a Canva clone or generic scheduler. The implementation keeps avatar/video generation, social publishing, CRM workflows, diagnosis workflows, and patient-identifiable generation prompts out of MVP scope. Flutter receives only public Supabase/API configuration and sends the Supabase JWT to the backend; provider and service-role secrets remain server-only.

Previous Sprint 8 backend-gated Flutter generation verification on `codex/pl-flutter-api-generation`:

- `flutter pub add http` in `apps/praxislume_app` exited 0 and promoted the existing HTTP client package to a direct dependency.
- `dart format --set-exit-if-changed .` in `apps/praxislume_app` exited 0 after formatting was applied to the API client changes.
- `flutter analyze` in `apps/praxislume_app` exited 0 with no issues.
- `flutter test` in `apps/praxislume_app` exited 0 with 12 regular tests passing and 1 local Supabase/API smoke test skipped because dart defines were not provided.
- `npx.cmd supabase db reset` at repo root exited 0 and reapplied the current migration and seed.
- Local Fastify API `/ready` returned `{ ok: true, data: { status: "ready", provider: "fake" } }` on `http://127.0.0.1:8787`.
- `flutter test test/supabase_repository_smoke_test.dart --dart-define=SUPABASE_URL=http://127.0.0.1:54321 --dart-define=SUPABASE_ANON_KEY=<local publishable key> --dart-define=API_BASE_URL=http://127.0.0.1:8787` in `apps/praxislume_app` exited 0 with 1 backend-gated local smoke test passing.
- Backend-gated smoke coverage: created a local Supabase Auth user, saved onboarding/brand/logo data, generated the 30-day campaign through Fastify with the Supabase JWT, called caption, reel script, tone rewrite, and compliance review endpoints, verified `ai_generation_logs` contains `campaign_plan`, `content_item_caption`, `reel_script`, and `tone_rewrite`, verified `content_compliance_reviews` persistence, edited content, reloaded persisted data, and verified cross-clinic logo denial.
- `flutter build web --dart-define=SUPABASE_URL=http://127.0.0.1:54321 --dart-define=SUPABASE_ANON_KEY=<local publishable key> --dart-define=API_BASE_URL=http://127.0.0.1:8787` in `apps/praxislume_app` exited 0 and built `build\web`; Flutter printed the existing non-fatal icon font warning.
- Browser load check for `http://127.0.0.1:8086/#/signin` returned title `PraxisLume` and 0 console errors.
- `npm.cmd run lint` at repo root exited 0.
- `npm.cmd run typecheck` at repo root exited 0.
- `npm.cmd test` at repo root exited 0 with 6 contract tests and 11 API tests passing.
- `npm.cmd run build` at repo root exited 0.
- `npm.cmd run supabase:test:rls` at repo root exited 0, including logo object isolation checks.
- Source-of-truth reconciliation: Sprint 8 closes the backend-gated generation gap for the pilot path. Flutter sends only the Supabase JWT to the Fastify API; no provider keys or service-role keys are in Flutter. Generation remains fake-provider/local-pilot safe, every generation route logs through the backend path, patient-identifiable data is still rejected by shared/API guards, and no social publishing, avatar/video, CRM, diagnosis, or Canva-style editor scope was added.

Previous Sprint 7 live brand logo storage verification on `codex/pl-live-brand-logo-storage`:

- `flutter pub add file_picker` in `apps/praxislume_app` exited 0 and added the controlled local file selection dependency.
- `dart format --set-exit-if-changed .` in `apps/praxislume_app` exited 0 after formatting was applied to the new upload/test code.
- `flutter analyze` in `apps/praxislume_app` exited 0 with no issues.
- `flutter test test/supabase_repository_smoke_test.dart --dart-define=SUPABASE_URL=http://127.0.0.1:54321 --dart-define=SUPABASE_ANON_KEY=<local publishable key>` in `apps/praxislume_app` exited 0 with 1 local Supabase smoke test passing.
- Logo smoke coverage: uploaded a PNG logo to `clinic-logos` at `<clinic_id>/logo.png`, downloaded it as the owner, verified `brand_kits.logo_path` after reload, then signed in as another local Auth user and verified the first clinic's logo path could not be downloaded.
- `flutter test` in `apps/praxislume_app` exited 0 with 11 regular tests passing and 1 local Supabase smoke test skipped because dart defines were not provided.
- `flutter build web --dart-define=SUPABASE_URL=http://127.0.0.1:54321 --dart-define=SUPABASE_ANON_KEY=<local publishable key>` in `apps/praxislume_app` exited 0 and built `build\web`; Flutter printed the existing non-fatal icon font warning.
- `npm.cmd run supabase:test:rls` at repo root exited 0, including logo object isolation checks.
- Browser load check for `http://127.0.0.1:8086/#/brand` returned title `PraxisLume` and 0 console errors.
- Source-of-truth reconciliation: Sprint 7 implements the light v0.2 brand logo requirement using controlled Supabase Storage and deterministic preview rendering. It does not add logo generation, freeform design editing, social publishing, avatar/video generation, CRM workflows, diagnosis workflows, or provider/service-role secrets in Flutter.

Previous Sprint 6 Flutter local Supabase smoke verification on `codex/pl-flutter-supabase-smoke`:

- `npx.cmd supabase db reset` at repo root exited 0 and reapplied `202606220001_initial_mvp_schema.sql` plus `supabase/seed.sql`.
- `flutter test test/supabase_repository_smoke_test.dart --dart-define=SUPABASE_URL=http://127.0.0.1:54321 --dart-define=SUPABASE_ANON_KEY=<local publishable key>` in `apps/praxislume_app` exited 0 with 1 local Supabase smoke test passing.
- Smoke coverage: created a real local Supabase Auth user, saved onboarding for an ENT clinic, saved brand kit CTA/color edits, generated a 30-day campaign, edited a content item caption, reloaded state through a fresh controller/repository, and verified clinic/services/doctor specialty/brand kit/campaign/items/edit persistence.
- `dart format --set-exit-if-changed .` in `apps/praxislume_app` exited 0 after formatting was applied once.
- `flutter analyze` in `apps/praxislume_app` exited 0 with no issues.
- `flutter test` in `apps/praxislume_app` exited 0 with 11 regular tests passing and 1 local Supabase smoke test skipped because dart defines were not provided.
- `flutter build web --dart-define=SUPABASE_URL=http://127.0.0.1:54321 --dart-define=SUPABASE_ANON_KEY=<local publishable key>` in `apps/praxislume_app` exited 0 and built `build\web`; Flutter printed the existing non-fatal icon font warning.
- Browser load check for `http://127.0.0.1:8086/#/signin` returned title `PraxisLume` and 0 console errors.
- Source-of-truth reconciliation: Sprint 6 remains inside v0.1 plus light v0.2. It proves real Supabase persistence for the existing MVP workflow, fixes a specialty-aware persistence bug, and does not introduce Canva-style editing, social publishing, avatar/video generation, CRM workflows, diagnosis workflows, or patient-identifiable generation inputs.

Previous Sprint 5 integration baseline verification on `codex/pl-integration-baseline`:

- `npm.cmd run lint` at repo root exited 0.
- `npm.cmd run typecheck` at repo root exited 0.
- `npm.cmd test` at repo root exited 0 with 6 contract tests and 11 API tests passing.
- `npm.cmd run docs:check` at repo root exited 0.
- `npm.cmd run build` at repo root exited 0.
- `npm.cmd run supabase:test:rls` at repo root exited 0 after verifying service-role writes plus cross-clinic campaign/logo isolation.
- `dart format --set-exit-if-changed .` in `apps/praxislume_app` exited 0 with 0 files changed.
- `flutter analyze` in `apps/praxislume_app` exited 0 with no issues.
- `flutter test` in `apps/praxislume_app` exited 0 with 11 tests passing.
- `flutter build web` in `apps/praxislume_app` exited 0 and built `build\web`.
- Day 2 visual QA PR preparation: head `codex/pl-ui-qa-smoke`, base `surgmuster`, URL `https://github.com/gchamania/praxislume/pull/new/codex/pl-ui-qa-smoke`. Connector PR creation returned GitHub API 403, so no remote PR was created by Codex.
- Source-of-truth reconciliation: the integration branch preserves the v0.1 plus light v0.2 boundary. It adds no Canva-style editing, social publishing, avatar/video generation, CRM workflows, diagnosis workflows, or patient-identifiable generation inputs. The remaining pilot gaps are real Flutter Supabase smoke, live logo storage, backend-gated generation, and release QA.

Previous Day 2 Sprint 4 visual QA verification on `codex/pl-ui-qa-smoke`:

- `dart format --set-exit-if-changed .` in `apps/praxislume_app` exited 0.
- `flutter analyze` in `apps/praxislume_app` exited 0 with no issues.
- `flutter test` in `apps/praxislume_app` exited 0 with 11 tests passing, including mobile drawer navigation coverage.
- `flutter build web` in `apps/praxislume_app` exited 0 and built `build\web`; Flutter printed a non-fatal Cupertino icon font warning plus Material icon tree-shaking output.
- Local static web server for `build\web` responded 200 at `http://127.0.0.1:8085`.
- Browser route smoke at `1440x900` and `390x844` for `/signin`, `/onboarding`, `/dashboard`, `/generate`, `/calendar`, `/library`, `/brand`, `/settings`, `/templates`, `/analytics`, and `/media-studio` loaded the Flutter view with page title `PraxisLume`, CanvasKit renderer, and 0 console errors after Flutter initialization.
- Source-of-truth reconciliation: the Day 2 QA pass remains within v0.1 plus light v0.2. It adds responsive polish and tests only; it does not add Canva-style editing, social publishing, avatar/video generation, CRM, diagnosis workflows, or patient-identifiable generation inputs.
- In-app browser screenshot capture timed out against the CanvasKit page, so visual screenshots still need manual capture or a different screenshot path.

Previous Day 2 visual redesign verification on `codex/pl-ui-visual-redesign`:

- `dart format --set-exit-if-changed .` in `apps/praxislume_app` exited 0.
- `flutter analyze` in `apps/praxislume_app` exited 0 with no issues.
- `flutter test` in `apps/praxislume_app` exited 0 with 10 tests passing.
- `flutter build web` in `apps/praxislume_app` exited 0 and built `build\web`; Flutter printed a non-fatal Cupertino icon font warning plus Material icon tree-shaking output.
- Local static web server for `build\web` responded 200 at `http://127.0.0.1:8085`.
- Browser route smoke for `/signin`, `/signup`, `/onboarding`, `/dashboard`, `/generate`, `/calendar`, `/library`, `/brand`, `/settings`, `/templates`, `/analytics`, and `/media-studio` loaded the Flutter view with page title `PraxisLume` and 0 console errors after Flutter initialization.

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
