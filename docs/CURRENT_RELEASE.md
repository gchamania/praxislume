# PraxisLume Current Release

## Target

Current target: Foundation v0.0, MVP v0.1, and light v0.2 brand kit.

Pilot promise:

> A doctor can sign up, create a clinic profile and brand kit, generate a 30-day specialty-aware content campaign, review conservative content, and manually copy or export usable posts.

## Foundation v0.0

Build the repo foundation without complete product features:

- Flutter app shell with routes, design tokens, placeholder data, and baseline tests.
- Fastify API with health, readiness, config validation, logging, auth middleware interface, contracts, fake provider, OpenAI-compatible provider adapter, and tests.
- Supabase config, migrations, seed data, RLS, and verification SQL.
- Shared Zod contracts.
- CI, setup docs, and environment examples.

Acceptance gate:

- Flutter format, analyze, and tests run.
- API lint, typecheck, and tests run.
- Supabase migration SQL is present and reviewable.
- Canonical docs are populated and duplicate prefixed docs are removed.

## MVP v0.1

Included:

- Supabase Auth sign up, sign in, session gate, and sign out.
- Doctor and clinic onboarding.
- Specialty and service selection.
- Campaign creation for 7, 15, or 30 days.
- Calendar/list content workflow.
- Controlled content categories and statuses.
- AI campaign plan, caption, reel script, and tone rewrite through backend API.
- AI generation logs.
- Rules-first compliance review and usage controls.
- Manual copy/export only.

Excluded:

- Social publishing integrations.
- WhatsApp Business API automation.
- Freeform design canvas.
- AI image, voice, avatar, and video calls.
- CRM workflows.
- Advanced analytics.

Pilot exception: Day 3 includes a disabled-by-default backend visual asset route
for safe abstract thumbnails. It remains outside MVP core, requires explicit
server env enablement, and must not be exposed as a Canva-style editor, avatar,
video, or patient-image workflow.

## Light v0.2

Included:

- Clinic brand kit fields: logo, clinic name, doctor display name, qualifications, locations, phone, WhatsApp, appointment URL, colors, typography style, tone, default CTA, and disclaimer.
- Controlled Supabase Storage bucket for logos.
- Brand kit preview card.
- Brand kit context applied to new generation requests.

Excluded:

- Logo generation.
- Custom font upload.
- Drag and drop design editing.
- Multi-location brand overrides.

## Release Gate

Before pilot release:

- Cross-clinic RLS checks must pass.
- No provider secrets or service-role keys may appear in Flutter.
- Every generation route must validate inputs and write an AI generation log.
- Live provider calls must remain backend-only and configurable by server env.
- Patient-identifiable generation input must be rejected.
- QA report must cover auth, onboarding, campaign generation, compliance, copy/export, brand kit, and storage isolation.
