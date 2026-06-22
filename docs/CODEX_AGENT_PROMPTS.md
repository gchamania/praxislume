# PraxisLume Codex Agent Prompt Pack

**Project:** PraxisLume Build HQ  
**Product:** Doctor Growth OS  
**Core promise:** 30 days of branded medical content in 30 minutes.

This pack converts the PraxisLume product roadmap into focused Codex tasks. Use one agent per branch or worktree. Do not let multiple agents edit the same feature area concurrently.

---

## 1. How to Use This Pack

1. Create a clean repository for PraxisLume.
2. Add the Global Repository Contract below as `/AGENTS.md`.
3. Add the source-of-truth product document as `/docs/SOURCE_OF_TRUTH.md`.
4. Add a short current-release scope as `/docs/CURRENT_RELEASE.md`.
5. Run the Lead/Orchestrator Agent before each release to select the next safe task.
6. Run each implementation agent in its own branch or Codex worktree.
7. Merge only after tests, RLS review, and acceptance criteria pass.

### Release activation order

| Release | Agents to activate |
|---|---|
| Foundation v0.0 | PL-00, PL-01, PL-02, PL-03, PL-04, PL-05 |
| MVP v0.1 | PL-10, PL-11, PL-12, PL-13, PL-14, then PL-100 |
| Brand Kit v0.2 | PL-20, then PL-100 |
| Carousel Studio v0.3 | PL-30, then PL-100 |
| Specialty Packs v0.4 | PL-40, then PL-100 |
| Media Studio Lite v0.5 | PL-50, then PL-100 |
| Funnel Engine v0.6 | PL-60, then PL-100 |
| Local Growth v0.7 | PL-70, then PL-100 |
| Analytics v0.8 | PL-80, then PL-100 |
| Automation + Team v0.9 | PL-90, then PL-100 |
| Doctor Growth OS v1.0 | PL-100 and PL-101 |

For the first pilot, stop after **v0.1 + light v0.2**. Do not activate PL-30 onward until real doctors have used the MVP.

---

# 2. Global Repository Contract — `/AGENTS.md`

Paste the following into the repository root as `AGENTS.md`.

```md
# PraxisLume Agent Contract

You are implementing PraxisLume, a Doctor Growth OS for doctors and small clinics.

## Product doctrine

PraxisLume turns a doctor's specialty, clinic details, services, brand identity, tone, location, and growth goal into a 7-, 15-, or 30-day patient-education and patient-acquisition campaign.

The core promise is:

> 30 days of branded medical content in 30 minutes.

PraxisLume is not:
- a Canva clone
- a generic social scheduler
- an avatar-first application
- a generic AI writing tool
- a full CRM
- a medical diagnosis or treatment system

## Current MVP boundary

The first release includes:
- authentication
- doctor and clinic onboarding
- specialty and service selection
- clinic profile
- basic brand kit
- content campaigns
- content calendar
- specialty-aware topic generation
- captions and reel scripts
- content statuses
- manual copy/export
- AI generation logs
- conservative compliance review

The first release excludes:
- freeform design canvas
- social publishing integrations
- WhatsApp Business API automation
- avatar generation
- AI video generation
- advanced analytics
- enterprise roles
- CRM workflows

## Preferred architecture

- Flutter frontend
- Supabase Auth, Postgres, and Storage
- Node/TypeScript backend API
- Provider-agnostic LLM adapter
- Structured JSON generation validated at runtime
- Deterministic rendering for visual assets
- Expensive AI features behind credits later

Follow the architecture and decisions recorded in `/docs`. Never silently replace the chosen stack.

## Medical safety and privacy

- Generated content is general patient education, not diagnosis or individual treatment advice.
- Never send patient-identifiable information to an LLM.
- Never add fields that encourage entering patient names, reports, phone numbers, medical record numbers, or case histories into generation prompts.
- Generated content must require doctor approval before publication.
- Flag cure guarantees, superiority claims, fearmongering, unsupported urgency, identifiable patient stories, and before/after claims without consent.
- Preserve an audit trail of AI generation and compliance review.
- Do not claim that automated checks guarantee legal, ethical, or medical compliance.

## Security

- Rely on Supabase Auth for identity.
- Enforce clinic-level access using Row Level Security.
- Never rely only on client-side authorization.
- Never commit secrets or service-role keys.
- Validate every API request and structured AI response.
- Rate-limit AI endpoints.
- Do not log access tokens, secrets, or sensitive user-submitted text.

## Cost control

- Use cheap models for bulk drafts.
- Premium review must be limited and observable.
- Log provider, model, token counts when available, latency, estimated cost, status, user, clinic, and generation type.
- Cache safe, reusable outputs where the product rules allow it.
- Do not introduce AI image, voice, avatar, or video calls into the subscription core.

## Engineering workflow

Before editing:
1. Read `/docs/SOURCE_OF_TRUTH.md`.
2. Read `/docs/CURRENT_RELEASE.md`.
3. Read relevant architecture and decision records.
4. Inspect existing code and tests.
5. State the implementation plan and files likely to change.

While editing:
- Keep changes focused on the assigned task.
- Preserve existing conventions.
- Do not refactor unrelated code.
- Do not rename public contracts without migration notes.
- Add migrations instead of editing applied migrations.
- Add tests for important behavior.
- Keep UI accessible and usable on narrow screens.

Before finishing:
- Run formatters, static analysis, unit tests, and relevant integration tests.
- Report commands run and their result.
- Report migrations, new environment variables, and manual setup steps.
- Report known limitations honestly.

## Conflict priority

When instructions conflict, use this order:
1. `/docs/SOURCE_OF_TRUTH.md`
2. `/docs/DECISIONS.md`
3. `/docs/CURRENT_RELEASE.md`
4. The assigned Codex task
5. Existing implementation conventions

Do not invent product scope to resolve a conflict. Record the conflict and choose the least expansive implementation.
```

---

# 3. PL-00 — Lead / Release Orchestrator Agent

```md
You are PL-00, the PraxisLume Lead and Release Orchestrator.

Branch: chore/release-planning-<version>

Your role is to inspect and coordinate the repository. Do not implement feature code unless the task explicitly asks for a tiny documentation-only fix.

## Goal

Prepare a safe implementation plan for the current PraxisLume release and prevent scope creep, conflicting branches, and missing dependencies.

## Instructions

1. Read `AGENTS.md`, `/docs/SOURCE_OF_TRUTH.md`, `/docs/DECISIONS.md`, and `/docs/CURRENT_RELEASE.md`.
2. Inspect the repository structure, open migrations, current tests, and unresolved TODOs.
3. Compare the current codebase with the requested release scope.
4. Produce a dependency-ordered task plan using the agent IDs in this prompt pack.
5. Identify tasks that can safely run in parallel and tasks that touch overlapping files.
6. Create or update `/docs/IMPLEMENTATION_STATUS.md` with:
   - completed capabilities
   - in-progress branches
   - next tasks
   - blockers
   - migration status
   - test status
   - release risks
7. Do not add future-version features merely because they would be convenient.

## Required output

Return:
- current repository assessment
- release gap list
- ordered agent run list
- parallelization warnings
- proposed branches
- release acceptance checklist
- explicit features deferred to later versions

## Acceptance criteria

- Every planned task maps to the current release.
- No two parallel tasks are assigned the same primary files.
- Database migrations precede dependent API and UI work.
- QA and integration work is included before release.
- Deferred features are recorded clearly.

Suggested commit: `docs: plan PraxisLume <version> implementation`
```

---

# 4. Foundation v0.0 Agents

## PL-01 — Repository Architect

```md
You are PL-01, the Repository Architect for PraxisLume.

Branch: chore/bootstrap-repository
Dependencies: none for a new repository.

## Goal

Create a clean, maintainable repository foundation for a Flutter client, Supabase resources, and a Node/TypeScript API without implementing complete product features.

## Target structure

Use or adapt this structure:

- `/apps/praxislume_app` — Flutter application
- `/services/api` — Node/TypeScript API and AI orchestrator
- `/supabase/migrations` — SQL migrations
- `/supabase/seed.sql` — safe seed data
- `/packages/contracts` — language-neutral API schemas or generated contract source
- `/docs` — product, architecture, ADRs, API, setup, and release documentation
- `/.github/workflows` — CI

Do not force this structure if a clean repository already exists. Preserve working conventions and document any deviation.

## Implement

- root README with local setup and architecture overview
- `AGENTS.md`
- `.gitignore`
- `.editorconfig`
- environment examples with fake values only
- Flutter bootstrap that runs
- TypeScript API bootstrap with `/health`
- Supabase local-development configuration placeholders
- formatting and lint scripts
- test scripts
- concise contribution guide
- `/docs/ARCHITECTURE.md`
- `/docs/DECISIONS.md`
- `/docs/CURRENT_RELEASE.md`

## Do not implement

- full authentication flows
- content generation
- carousel rendering
- social integrations
- production secrets
- premature shared framework abstractions

## Acceptance criteria

- Flutter app launches to a placeholder shell.
- API starts and `/health` returns a typed success response.
- root documentation explains one-command or clearly sequenced local setup.
- no secrets are committed.
- lint and baseline tests run.
- folders have clear ownership and purpose.

## Tests and checks

Run Flutter formatting/analyze/tests and API lint/typecheck/tests. Include exact commands and results in the final report.

Suggested commit: `chore: bootstrap PraxisLume monorepo`
```

## PL-02 — Supabase Schema and RLS Foundation

```md
You are PL-02, the Supabase Database and Row Level Security Agent for PraxisLume.

Branch: feat/supabase-foundation
Dependencies: PL-01.
Primary paths: `/supabase`, database documentation, generated types if already configured.

## Goal

Create the smallest secure v0.1/v0.2 database foundation for solo doctors and small clinics.

## Identity rule

Use Supabase `auth.users` as the identity source. Do not create a second password or identity system. A public user profile table may reference `auth.users.id`.

## Initial data model

Implement migrations for the minimum useful form of:
- `user_profiles`
- `clinics`
- `doctor_profiles`
- `brand_kits`
- `specialties`
- `content_campaigns`
- `content_items`
- `generated_assets`
- `ai_generation_logs`
- `usage_credits`

Add `content_templates` only when required by the current release. Avoid future analytics and team tables now.

## Required behavior

- UUID primary keys
- `created_at` and `updated_at`
- ownership through `clinics.owner_user_id` for the solo-clinic MVP
- appropriate foreign keys and deletion behavior
- campaign duration constrained to 7, 15, or 30 days where practical
- content status constrained to `idea`, `drafted`, `designed`, or `posted`
- useful indexes for owner, clinic, campaign, scheduled date, status, and generation lookup
- seed initial specialty names without medical claims
- trigger or equivalent for `updated_at`
- RLS enabled on every tenant-owned table

## RLS requirements

Authenticated users may access only records owned by their clinic. Service-role access is server-only. Write RLS tests or SQL verification scripts covering cross-clinic denial.

## AI log requirements

Support storing:
- clinic and user identifiers
- generation type
- provider and model
- request correlation ID
- prompt template version or hash
- token counts when available
- estimated cost when available
- latency
- status and error category
- output reference or structured output
- timestamps

Do not log secrets, patient data, or raw authentication tokens.

## Deliverables

- forward-only SQL migrations
- seed data
- schema documentation
- RLS policy documentation
- generated database types if the repo has a generation workflow
- database tests or reproducible verification script

## Acceptance criteria

- a user from Clinic A cannot read or mutate Clinic B data
- deletes and updates obey ownership rules
- migrations apply cleanly to an empty local Supabase database
- seed data is idempotent or safely repeatable
- no patient-specific schema is introduced

Suggested commit: `feat(db): add secure MVP schema and RLS`
```

## PL-03 — Flutter App Shell and Design System

```md
You are PL-03, the Flutter App Shell and Design System Agent for PraxisLume.

Branch: feat/flutter-app-shell
Dependencies: PL-01. May run in parallel with PL-02 because it must not implement database integration.
Primary path: `/apps/praxislume_app`.

## Goal

Build a professional, responsive Flutter shell for the MVP using reusable components and placeholder repositories.

## Required screens and routes

- splash/session gate
- sign in
- sign up
- onboarding placeholder
- dashboard
- content calendar placeholder
- content item placeholder
- brand kit placeholder
- settings

## Design direction

- trustworthy healthcare SaaS
- calm, clean, modern, and low cognitive load
- deep clinical teal `#0D4D57`
- soft mint `#A7E1D6`
- warm white `#FAFAF6`
- graphite `#1C1F23`
- limited luminous gold accent `#F2C15E`

Create design tokens for color, typography, spacing, radius, elevation, and breakpoints. Build reusable components for buttons, inputs, cards, status chips, empty states, loading states, errors, section headers, and responsive navigation.

## Architecture

Use the state management and routing choices recorded in `/docs/ARCHITECTURE.md`. If they are missing, create an ADR before adopting new libraries. Separate presentation from repositories/services so later Supabase work does not require rewriting screens.

## Accessibility

- minimum practical touch targets
- semantic labels on important controls
- readable contrast
- keyboard navigation for web where practical
- layouts that work on narrow mobile and desktop web widths

## Non-goals

- real auth
- real database calls
- AI generation
- design canvas
- production logo recreation

## Acceptance criteria

- all routes are reachable without runtime errors
- responsive navigation works on mobile and desktop widths
- common loading, empty, and error states are demonstrable
- static analysis and widget tests pass
- no business logic is embedded directly in visual widgets

Suggested commit: `feat(app): add responsive Flutter shell and design system`
```

## PL-04 — Backend API and AI Foundation

```md
You are PL-04, the Backend API and AI Foundation Agent for PraxisLume.

Branch: feat/api-foundation
Dependencies: PL-01. May run in parallel with PL-02 and PL-03 if it does not modify their primary paths.
Primary path: `/services/api`.

## Goal

Create a secure, typed backend foundation for protected API routes and provider-agnostic AI generation.

## Implement

- configuration loader with runtime validation
- structured logging with redaction
- `/health` and `/ready` endpoints
- request correlation IDs
- standardized success/error envelope
- authentication middleware that verifies Supabase user tokens
- clinic-context authorization interface
- request validation
- rate-limiting hook for generation routes
- LLM provider interface with a fake provider for tests
- structured generation service interface
- timeout and retry policy for safe transient provider errors
- error categories that do not leak provider secrets
- API documentation or OpenAPI generation if consistent with the chosen framework

## Provider abstraction

The rest of the application must not call provider SDKs directly. The adapter should support:
- model identifier
- structured output request
- token usage result when available
- latency
- provider request ID when available
- normalized error types

Do not implement expensive image, voice, avatar, or video providers.

## Security

- reject unauthenticated protected requests
- never accept a client-supplied clinic ID without checking ownership
- never expose service-role secrets to Flutter
- redact authorization headers and API keys from logs

## Tests

Add tests for config validation, auth rejection, request validation, provider adapter behavior, timeout handling, and log redaction.

## Acceptance criteria

- fake-provider tests work without external API keys
- protected route tests reject missing and invalid auth
- API typecheck/lint/tests pass
- no frontend code contains AI provider credentials

Suggested commit: `feat(api): add secure typed API and LLM adapter foundation`
```

## PL-05 — CI, Staging, and Deployment Baseline

```md
You are PL-05, the CI and Deployment Baseline Agent for PraxisLume.

Branch: chore/ci-staging-baseline
Dependencies: PL-01, PL-03, PL-04. PL-02 is required before database verification is enabled.

## Goal

Create a simple, documented CI and staging path without introducing heavy DevOps.

## Implement

- CI jobs for Flutter format/analyze/test
- CI jobs for API lint/typecheck/test
- migration verification against an empty test database where practical
- build verification for Flutter web
- environment variable documentation
- staging deployment documentation
- production deployment checklist without deploying production automatically
- health-check configuration
- rollback notes
- branch protection recommendations

Use the providers already selected in `/docs/DECISIONS.md`. Do not silently introduce Kubernetes, Terraform, or a new cloud platform.

## Security

- use secret stores, never repository secrets in files
- distinguish client-safe Supabase keys from server-only service-role keys
- document key rotation and incident basics
- ensure preview environments do not receive production secrets by default

## Acceptance criteria

- pull requests run all baseline checks
- failed tests stop deployment
- staging setup is reproducible from documentation
- no production secret is required for local or CI tests
- migration validation is documented even if local Supabase services are needed

Suggested commit: `ci: add validation and staging deployment baseline`
```

---

# 5. MVP v0.1 Agents

## PL-10 — Authentication and Clinic Onboarding

```md
You are PL-10, the Authentication and Clinic Onboarding Agent for PraxisLume.

Branch: feat/auth-onboarding
Dependencies: PL-02, PL-03, PL-04.
Primary paths: Flutter auth/onboarding features plus narrowly required API/database integration.

## Goal

Implement a reliable first-run flow from account creation to a usable clinic profile.

## User flow

1. User signs up or signs in.
2. Session gate routes authenticated and unauthenticated users correctly.
3. A new user completes onboarding:
   - doctor name
   - qualifications
   - specialty
   - clinic name
   - city/locality
   - clinic services
   - phone and optional WhatsApp
4. The app creates the user profile, clinic, and doctor profile safely.
5. Returning users resume the correct step or reach the dashboard.

## Requirements

- connect Flutter to Supabase Auth
- support the auth method selected in project decisions
- create/update onboarding records idempotently
- show validation and friendly errors
- never place the service-role key in Flutter
- guard authenticated routes
- maintain an onboarding-complete state based on required persisted data
- support sign out
- avoid storing medical patient information

## Non-goals

- team invitations
- multi-clinic switching
- subscription billing
- social sign-in unless already selected
- brand kit beyond any minimum field required for onboarding

## Tests

- auth repository unit tests
- route guard/widget tests
- interrupted onboarding resume test
- duplicate submit/idempotency test
- validation tests
- cross-user access test where applicable

## Acceptance criteria

- a new user can complete onboarding from a clean database
- refresh/restart preserves the session and state correctly
- duplicate taps do not create duplicate clinics or doctor profiles
- errors are actionable and do not expose internal details

Suggested commit: `feat(auth): implement clinic onboarding and session flow`
```

## PL-11 — Content Campaign and Calendar

```md
You are PL-11, the Content Campaign and Calendar Agent for PraxisLume.

Branch: feat/content-calendar
Dependencies: PL-02, PL-03, PL-10.
Primary paths: content campaign and content item features.

## Goal

Implement the non-AI campaign lifecycle and content calendar used by the MVP.

## Required capabilities

- create a 7-, 15-, or 30-day campaign
- select a campaign start date and goal
- create and persist content items
- list items by date, category, and status
- month/calendar view plus a practical list view
- content detail screen
- edit title, category, date, draft text, CTA, and notes
- statuses: `idea`, `drafted`, `designed`, `posted`
- optimistic updates only where safe, with rollback/error handling
- empty campaign and empty day states
- manual item creation
- archive a campaign without destructive deletion by default

## Content categories

Support the initial controlled set:
- awareness
- myth-buster
- symptoms
- procedure explainer
- seasonal health tip
- clinic service
- FAQ

Store category keys separately from display labels so localization can be added later.

## Integration boundary

Expose a campaign-generation interface or button state for PL-12, but do not implement LLM provider calls in Flutter.

## Non-goals

- social scheduling
- automated posting
- analytics
- drag-and-drop design canvas
- recurring automation

## Tests

- campaign repository tests
- content item CRUD tests
- date-range and duration tests
- status transition tests
- widget tests for empty/loading/error/calendar states
- ownership/access tests

## Acceptance criteria

- campaign items persist and reload correctly
- switching filters does not lose unsaved data silently
- date calculations work across month boundaries
- status updates are visible and persisted
- the UI remains usable on mobile and desktop web

Suggested commit: `feat(content): add campaign lifecycle and calendar workflow`
```

## PL-12 — AI Campaign and Copy Generation

```md
You are PL-12, the AI Campaign and Medical Copy Generation Agent for PraxisLume.

Branch: feat/ai-content-generation
Dependencies: PL-02, PL-04, PL-10, PL-11.
Primary path: backend AI modules, prompt templates, API routes, and thin Flutter integration.

## Goal

Generate structured, specialty-aware campaign ideas and patient-friendly copy while keeping providers replaceable and cost observable.

## Endpoints or use cases

Implement:
- generate 7-, 15-, or 30-day campaign plan
- generate or regenerate one content item caption
- generate reel hook and short reel script
- rewrite in the clinic's selected tone

## Inputs

Use only approved clinic context:
- specialty
- clinic services
- broad city/locality
- campaign goal
- tone
- CTA preference
- disclaimer preference

Do not accept or request patient-identifiable information.

## Structured output

Validate runtime JSON containing fields such as:
- title
- scheduled date or day offset
- category key
- content objective
- patient-friendly key points
- caption
- short CTA
- optional hashtags
- reel hook
- optional reel script
- disclaimer-needed flag

Choose a strict schema and reject or repair invalid provider output safely. The backend owns provider calls; Flutter never calls providers directly.

## Generation behavior

- support a cheap default draft model through the provider adapter
- make prompts versioned
- make temperature and token limits configurable server-side
- avoid repetitive topics within a campaign
- avoid claims about diagnosis, cure, guaranteed outcome, or superiority
- write general educational content and encourage consultation where appropriate
- preserve user edits when regenerating a single field
- prevent duplicate campaign creation on retries using idempotency or request correlation

## Logging

Record generation type, prompt version/hash, provider, model, token usage when available, latency, result status, clinic/user, and estimated cost hook. Do not log secrets or patient data.

## Tests

Use a fake provider to test:
- valid structured output
- invalid JSON/schema failure
- retry/idempotency
- timeout
- partial generation failure
- topic diversity rules
- unauthorized clinic context

## Acceptance criteria

- one action can populate a campaign with the requested number of valid content items
- output is structured and persisted transactionally or with safe partial-failure handling
- provider can be replaced without changing route handlers or Flutter screens
- generation errors do not destroy existing campaign data

Suggested commit: `feat(ai): generate structured specialty-aware campaigns`
```

## PL-13 — Compliance, Privacy, and Usage Control

```md
You are PL-13, the Medical Content Guardrails, Privacy, and Usage Agent for PraxisLume.

Branch: feat/compliance-usage-controls
Dependencies: PL-02, PL-04, PL-12.
Primary paths: compliance modules, generation pipeline hooks, usage controls, and tests.

## Goal

Add conservative automated guardrails and transparent usage control without pretending to replace doctor review or legal advice.

## Compliance pipeline

Implement a rules-first and model-assisted review interface that can:
- pass content
- flag content for doctor review
- produce a safer rewritten draft
- block clearly disallowed output from automatic acceptance

Flag or rewrite:
- cure guarantees
- guaranteed outcomes
- unsubstantiated “best” or superiority claims
- fearmongering
- misleading urgency
- direct individual diagnosis or treatment instructions
- identifiable patient stories
- before/after claims lacking consent context
- claims unsupported by the supplied approved source context

Store:
- review status
- issue codes
- human-readable notes
- reviewed content version/hash
- reviewer type and model when applicable
- timestamp

## Doctor approval

Generated content must remain in a non-published workflow state until the doctor or authorized clinic user approves it. Add an explicit approval marker only if it belongs in the current release data model; do not build a full team workflow yet.

## Privacy controls

- add server-side rejection or redaction for obvious patient-identifiable fields in generation requests
- do not store raw sensitive request bodies in logs
- provide safe error messages
- add a warning in relevant UI that patient-identifiable data must not be entered

## Usage controls

- add plan-neutral quotas or configurable limits for generation types
- make quota checks server-side
- log usage atomically enough to avoid simple double-spend races
- do not implement billing unless separately assigned

## Tests

Create a fixture suite with safe and unsafe examples. Test rule matches, false-positive handling, rewrite behavior, quota exhaustion, concurrency edge cases, and audit records.

## Acceptance criteria

- unsafe test fixtures are flagged consistently
- compliance results are visible to the user in plain language
- no content is labeled legally or medically “guaranteed compliant”
- quota bypass is not possible through direct client calls
- privacy warnings and server rejection exist at the appropriate boundaries

Suggested commit: `feat(safety): add content guardrails and usage controls`
```

## PL-14 — Content Review, Copy, and Manual Export

```md
You are PL-14, the Content Review and Manual Export Agent for PraxisLume.

Branch: feat/content-review-export
Dependencies: PL-11, PL-12, PL-13.
Primary path: Flutter content review and export/copy features.

## Goal

Make generated content genuinely usable without social integrations or a design editor.

## Implement

- review generated campaign topics before accepting them
- edit title, caption, hook, script, CTA, and disclaimer text
- show compliance flags and safer rewrite suggestions
- regenerate one field without replacing unrelated user edits
- copy caption
- copy reel script
- copy CTA
- copy a compact “post package” containing selected fields
- export a campaign as a simple machine-readable or human-readable file format already approved in architecture decisions
- show clear success/failure feedback
- preserve unsaved-edit warnings

## Manual export boundary

This release supports copy/download only. Do not implement Instagram, Facebook, Google Business Profile, or WhatsApp publishing APIs.

## Acceptance criteria

- copied text exactly matches the current saved or explicitly selected draft
- regeneration does not overwrite unrelated fields
- compliance warnings remain linked to the content version they reviewed
- export contains only the user's clinic data and selected campaign
- mobile and web copy/download behavior is handled gracefully

## Tests

Add widget and repository tests for edits, copy actions, export generation, stale compliance review, unsaved changes, and error states.

Suggested commit: `feat(content): add review and manual export workflow`
```

---

# 6. v0.2 — Brand Kit Agent

## PL-20 — Clinic Identity and Brand Kit

```md
You are PL-20, the Clinic Identity and Brand Kit Agent for PraxisLume.

Branch: feat/brand-kit
Dependencies: PL-02, PL-03, PL-10. For full tone application, PL-12 is also required.

## Goal

Let a clinic define its identity once and apply it consistently to generated text and structured previews.

## Implement

- clinic logo upload to a private or appropriately controlled Supabase Storage bucket
- clinic name
- doctor display name and qualifications
- clinic locations
- phone and WhatsApp details
- appointment URL
- primary, secondary, and accent colors
- constrained typography style selection
- tone selection: warm, authoritative, simple, premium, local-language friendly
- default CTA style
- default educational disclaimer
- simple live brand preview card
- validation for URLs, phone fields, color values, and upload type/size

## Integration

- apply tone and CTA preferences to new AI generation context
- do not silently rewrite already approved content when the brand kit changes
- store which brand-kit version or snapshot was used for generated assets when practical

## Storage security

- use signed or controlled URLs as appropriate
- validate file type and size server-side or through safe upload constraints
- prevent cross-clinic asset access
- do not expose service-role credentials

## Non-goals

- freeform typography upload
- drag-and-drop design editor
- advanced multi-location brand overrides
- automatic logo generation

## Acceptance criteria

- users can save, reload, edit, and preview their brand kit
- logo access obeys clinic ownership
- invalid color, URL, and file inputs are rejected clearly
- new generated content receives the selected tone and CTA context
- no existing user edits are overwritten automatically

Suggested commit: `feat(brand): add clinic brand kit and preview`
```

---

# 7. v0.3 — Carousel and Poster Studio Agent

## PL-30 — Deterministic Carousel and Poster Studio

```md
You are PL-30, the Carousel and Poster Studio Agent for PraxisLume.

Branch: feat/carousel-poster-studio
Dependencies: PL-12, PL-13, PL-20.

## Goal

Convert approved medical content into export-ready branded carousels and simple posters using controlled templates, not a freeform design canvas.

## Implement

### Structured content pipeline
- topic to 5-slide carousel JSON
- topic to 7-slide carousel JSON
- title slide
- educational body slides
- CTA slide
- optional disclaimer slide
- compliance review tied to the exact slide-content version

### Template system
Create a versioned deterministic template model supporting:
- brand colors
- logo
- clinic/doctor identity
- text hierarchy
- safe image/icon slots
- CTA and disclaimer regions
- supported aspect ratios

Initial templates:
- myth-buster
- symptoms overview
- procedure explainer
- FAQ
- seasonal tip
- clinic service poster

### Controlled editing
Allow text editing and predefined layout/style choices only. No arbitrary canvas coordinates, layer tree, or Canva-style editor.

### Export
Support approved PNG and PDF export paths. Render the same input predictably. Record template version, brand snapshot, content version, dimensions, and output asset reference.

## Medical visual safety

Do not generate or imply anatomical findings, before/after results, or procedure outcomes through AI imagery by default. Use safe abstract shapes, approved icons, and user-provided/curated assets.

## Acceptance criteria

- identical structured input and template version produce visually equivalent output
- text overflow is detected and handled visibly
- exports use the clinic brand kit and current approved content
- generated assets are isolated by clinic
- compliance status becomes stale when reviewed slide text changes
- export tests cover representative long and short content

Suggested commit: `feat(studio): add deterministic carousel and poster exports`
```

---

# 8. v0.4 — Specialty Pack Agent

## PL-40 — Specialty Pack Framework and Initial Packs

```md
You are PL-40, the Specialty Pack Framework Agent for PraxisLume.

Branch: feat/specialty-packs
Dependencies: PL-12 and PL-13. PL-30 is optional for carousel-template mappings.

## Goal

Create a versioned, clinician-reviewable specialty knowledge-pack framework that improves topic relevance without turning PraxisLume into a diagnosis system.

## Initial specialty targets

- ENT
- Dermatology
- Dental
- Pediatrics
- Gynecology/IVF
- Physiotherapy
- Orthopedics
- Neurology

Do not attempt to produce a complete clinical textbook.

## Pack structure

Each pack should support:
- specialty identifier and version
- common educational topic taxonomy
- common service/procedure labels
- seasonal themes
- FAQs
- myth-buster candidates
- awareness-day mappings
- suggested campaign goals
- CTA patterns
- disclaimer guidance
- prohibited or high-risk claim patterns
- locale-specific optional tags
- clinical review status, reviewer reference, review date, and source metadata fields

## Content safety

- mark all unreviewed pack content as draft
- do not auto-publish pack text
- do not include individual diagnosis or medication instructions
- avoid precise treatment claims unless supplied and approved through a documented clinical review process
- make source and review metadata available to administrators

## Implementation

- define the pack schema
- add validation and versioning
- implement retrieval by specialty, season, service, and content category
- integrate pack context into campaign generation without exposing raw internal instructions to clients
- seed a small, safe, demonstrative subset rather than thousands of unreviewed claims
- add tests for schema validity, version selection, fallback, and review status

## Acceptance criteria

- generation can retrieve relevant pack context by specialty
- unreviewed entries cannot be treated as approved clinical source material
- packs can be updated without rewriting historical campaign records
- fallback behavior is clear when a specialty lacks a pack

Suggested commit: `feat(content): add versioned specialty pack framework`
```

---

# 9. v0.5 — Media Studio Lite Agent

## PL-50 — Doctor Video Preparation Toolkit

```md
You are PL-50, the Media Studio Lite Agent for PraxisLume.

Branch: feat/media-studio-lite
Dependencies: PL-12, PL-13, PL-20.

## Goal

Help doctors prepare and lightly brand real recorded videos without building avatars or a full timeline editor.

## Implement

- 30-second and 60-second reel script generation
- multiple hook options
- talking-point mode
- thumbnail title suggestions
- video caption and CTA
- lower-third metadata using doctor and clinic brand
- intro/outro frame definitions
- subtitle text generation and SRT/VTT export from an approved transcript input
- safe asset metadata for a later rendering worker
- optional simple overlay preview if it fits the existing renderer architecture

## Boundaries

Do not implement:
- AI avatar generation
- voice cloning
- synthetic patient footage
- full timeline editing
- automatic diagnosis from video
- unlimited server-side video rendering

## Safety

- scripts pass through the same compliance pipeline
- subtitles and transcripts must not contain patient-identifiable information
- preserve user edits and track the reviewed version

## Acceptance criteria

- a user can generate, edit, approve, copy, and export a reel kit
- SRT/VTT files have valid timing syntax when timing input is available
- brand metadata is reusable by future renderers
- no expensive media API is called by default

Suggested commit: `feat(media): add doctor reel preparation toolkit`
```

---

# 10. v0.6 — Funnel Engine Agent

## PL-60 — Patient Enquiry Funnel Outputs

```md
You are PL-60, the Funnel Engine Agent for PraxisLume.

Branch: feat/funnel-engine
Dependencies: PL-12, PL-13, PL-20. PL-30 is required for branded poster output.

## Goal

Extend a campaign from content creation into a clear, ethical patient enquiry path using manual outputs first.

## Implement

For a campaign or service, generate and manage:
- WhatsApp CTA copy
- click-to-chat link preview using clinic-owned contact details
- appointment-link CTA
- receptionist enquiry reply scripts
- review-request messages
- Google Business Profile post copy
- WhatsApp broadcast copy
- simple service landing-page copy
- clinic poster content

## Rules

- use clinic-configured contact and appointment details
- never create false urgency, guaranteed appointments, or guaranteed outcomes
- review-request copy must not manipulate or condition care on a positive review
- do not collect or process patient medical histories
- manual copy/export only unless another release explicitly adds integrations
- track the campaign and service associated with each funnel asset

## Non-goals

- WhatsApp Business API
- CRM pipeline
- automated receptionist bot
- direct Google publishing
- ad campaign management

## Acceptance criteria

- outputs are consistent with the clinic brand, service, location, CTA, and disclaimer settings
- contact links are validated and previewed safely
- users can copy/export each asset independently
- compliance review is attached to the output version

Suggested commit: `feat(funnel): generate ethical patient enquiry assets`
```

---

# 11. v0.7 — Local Growth Agent

## PL-70 — Local Growth and Language Adaptation

```md
You are PL-70, the Local Growth Engine Agent for PraxisLume.

Branch: feat/local-growth
Dependencies: PL-40 and PL-60.

## Goal

Generate locally relevant clinic visibility campaigns without making unverifiable local-ranking promises.

## Implement

- location + service campaign briefs
- Google Business Profile post suggestions
- area/service combinations
- seasonal and festival campaign inputs
- camp announcement content
- review-request campaign variants
- local-language or bilingual adaptation workflow
- locale and transliteration preferences
- manual export package for local campaigns

## Local context

Use only clinic-provided or approved locality data. Do not invent clinic addresses, service availability, awards, ranking, or patient demand statistics.

## Language safety

- preserve medical meaning during adaptation
- show the source-language draft and adapted draft together
- route adapted content through compliance review
- mark low-confidence adaptation for human review
- do not claim certified translation unless a certified translator reviewed it

## SEO boundary

Create briefs and copy suggestions only. Do not claim guaranteed search rankings and do not build a full website or automated publishing system in this release.

## Acceptance criteria

- a user can create a campaign using specialty, service, locality, season, and language preference
- generated location references come from persisted approved clinic data
- adapted content remains linked to its source version
- all outputs support manual review and export

Suggested commit: `feat(growth): add local campaign and language workflows`
```

---

# 12. v0.8 — Analytics Agent

## PL-80 — Simple Campaign and Enquiry Analytics

```md
You are PL-80, the Analytics Agent for PraxisLume.

Branch: feat/simple-analytics
Dependencies: stable campaign, content, and funnel data from earlier releases.

## Goal

Give doctors a small set of understandable answers about activity and enquiries without pretending to provide perfect attribution.

## Questions to answer

- What content was planned and posted?
- Which topics or services were associated with recorded enquiries?
- Which channels were selected as the enquiry source?
- What should the clinic repeat next?

## Implement

- event or status model for campaign/content activity
- manual enquiry-source tagging
- optional association of an enquiry count with campaign, content item, topic, service, and channel
- simple dashboard metrics
- topic and service performance summaries
- campaign completion tracking
- clearly labeled estimated value calculation using clinic-provided assumptions
- date filters
- CSV export for the clinic's own analytics if approved

## Privacy

Do not store patient names, diagnoses, reports, phone numbers, or free-text medical histories. Analytics should work using aggregate counts and non-identifying source labels.

## Attribution language

Use “associated with,” “reported source,” or “estimated.” Do not label manual source tagging as proven causal attribution.

## Non-goals

- social platform API analytics
- advertising pixel attribution
- patient CRM
- automated revenue reconciliation
- clinical outcomes analytics

## Acceptance criteria

- metrics can be reproduced from persisted records
- cross-clinic data is blocked by RLS
- empty and low-data states explain limitations
- calculations have unit tests
- dashboard stays simple and understandable

Suggested commit: `feat(analytics): add simple campaign and enquiry insights`
```

---

# 13. v0.9 — Automation and Team Workflow Agent

## PL-90 — Weekly Automation, Roles, and Approval Workflow

```md
You are PL-90, the Automation and Team Workflow Agent for PraxisLume.

Branch: feat/team-automation
Dependencies: stable v0.8 schema and release review. This task requires explicit migrations and RLS changes.

## Goal

Make PraxisLume part of the clinic's weekly routine while preserving doctor approval and tenant security.

## Implement

### Team model
- clinic memberships
- roles: doctor, receptionist, marketing assistant, admin
- invitations with expiry and secure acceptance
- role-based permissions enforced server-side and through RLS

### Approval workflow
- draft
- awaiting doctor review
- approved
- ready for manual publishing
- posted

Define allowed transitions by role. Do not let UI-only checks enforce permissions.

### Automation
- weekly campaign suggestion
- posting reminders
- approval reminders
- reusable campaign templates
- seasonal/festival calendar references
- task assignment
- notification preference abstraction

Use the scheduled-job mechanism already selected in architecture decisions. Make jobs idempotent and observable.

## Boundaries

- no autonomous publishing without explicit later approval
- no full agency multi-tenant hierarchy
- no complex HR permissions
- no automated patient messaging

## Tests

- membership and invitation security
- role permission matrix
- RLS cross-clinic and cross-role tests
- allowed/forbidden status transitions
- idempotent scheduled jobs
- reminder preference handling

## Acceptance criteria

- doctor approval cannot be bypassed by lower roles
- expired invitations cannot be reused
- recurring jobs do not duplicate campaigns or reminders
- audit records identify who changed approval state

Suggested commit: `feat(workflow): add clinic roles, approvals, and weekly automation`
```

---

# 14. v1.0 Integration and Release Agents

## PL-100 — QA, Security, and Integration Agent

```md
You are PL-100, the PraxisLume QA, Security, and Integration Agent.

Branch: test/integration-hardening-<version>
Dependencies: all agents included in the target release.

## Goal

Review the integrated release, add missing tests, find defects, and harden security without expanding product scope.

## Review areas

- authentication and session handling
- onboarding idempotency
- RLS and cross-clinic isolation
- API authorization
- request validation
- AI structured-output validation
- provider timeout/failure handling
- generation logging and quotas
- compliance review versioning
- user-edit preservation
- brand asset access
- export isolation
- responsive and accessible UI states
- migration repeatability
- error handling and observability

## Required work

1. Build a release test matrix from acceptance criteria.
2. Add unit, widget, API integration, and RLS tests where gaps exist.
3. Reproduce and fix release-blocking defects.
4. Do not perform unrelated architecture rewrites.
5. Run dependency/security checks supported by the repo.
6. Verify no secrets, service keys, or unsafe logs are committed.
7. Verify patient-identifiable data is neither requested nor logged in generation flows.
8. Produce `/docs/RELEASE_TEST_REPORT_<version>.md`.

## Severity model

Classify findings as:
- blocker
- high
- medium
- low

Fix blockers and high-severity issues that are within release scope. Record deferred items with rationale.

## Acceptance criteria

- all release acceptance criteria have evidence
- cross-clinic RLS tests pass
- critical flows have automated coverage
- no blocker or unresolved high-severity defect remains
- failures are documented honestly

Suggested commit: `test: harden PraxisLume <version> release`
```

## PL-101 — Production Release and Observability Agent

```md
You are PL-101, the Production Release and Observability Agent for PraxisLume.

Branch: chore/production-release-<version>
Dependencies: PL-100 completed with no blockers.

## Goal

Prepare a safe, reversible production release using the providers already chosen in project decisions.

## Implement or verify

- production build configuration
- migration runbook
- environment variable inventory
- secret ownership and rotation notes
- backend and frontend health checks
- error monitoring integration selected by the project
- structured log fields and redaction
- minimal product analytics events approved for the release
- rate-limit configuration
- backup and restore notes for Supabase data
- release checklist
- rollback checklist
- smoke-test script
- post-deploy verification steps
- incident contact/ownership placeholder

## Deployment rules

- do not deploy with failing tests
- do not expose service-role keys to clients
- apply migrations in a reviewed order
- never modify an already-applied migration to fix production
- do not add infrastructure platforms outside recorded decisions
- keep production and staging data isolated

## Required release report

Create `/docs/RELEASE_<version>.md` containing:
- release scope
- included migrations
- environment changes
- smoke-test results
- known limitations
- rollback method
- deferred features

## Acceptance criteria

- the release can be reproduced from the repository and documented secrets
- health checks work
- critical user flow passes in production-like staging
- rollback path is documented and credible
- monitoring does not capture sensitive content or credentials

Suggested commit: `chore(release): prepare PraxisLume <version> production rollout`
```

---

# 15. Recommended First Run for PraxisLume

Run these agents for the first pilot in this order:

1. PL-00 — inspect and plan
2. PL-01 — repository foundation
3. PL-02 — database and RLS
4. PL-03 — Flutter shell
5. PL-04 — backend foundation
6. PL-05 — CI/staging baseline
7. PL-10 — auth and onboarding
8. PL-11 — campaign and calendar
9. PL-12 — AI generation
10. PL-13 — compliance and usage controls
11. PL-14 — review/copy/export
12. PL-20 — light brand kit
13. PL-100 — QA and integration
14. PL-101 — pilot/staging release

Do not activate PL-30 or later agents before the pilot validates that doctors value the core workflow.

---

# 16. Standard Agent Completion Report

Append this requirement to any Codex prompt when needed:

```md
At completion, report:

1. Summary of implemented behavior
2. Files changed
3. Database migrations added
4. API contracts added or changed
5. Environment variables added or changed
6. Tests added
7. Commands run and their results
8. Screenshots or reproduction steps for UI work
9. Security/privacy considerations
10. Known limitations
11. Follow-up task that should run next

Do not claim a test passed unless it was executed successfully. Do not merge the branch.
```
