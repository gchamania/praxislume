# PraxisLume Architecture

## Product Boundary

PraxisLume v0.1 plus light v0.2 is a Doctor Growth OS for solo doctors and small clinics. It creates specialty-aware patient education and acquisition campaigns, keeps generated content conservative, and requires clinic review before manual copy or export.

The MVP is not a Canva clone, social scheduler, CRM, diagnosis system, avatar tool, or AI video product.

## System Shape

- Flutter app in `apps/praxislume_app` is the primary client.
- Supabase Auth, Postgres, Storage, and RLS own identity, tenant data, and clinic assets.
- Node/TypeScript Fastify API in `services/api` owns protected AI and compliance routes.
- Shared Zod contracts in `packages/contracts` define request, response, enum, and error shapes.
- Deterministic rendering is the visual-output rule. v0.1/v0.2 only includes a brand preview, not a freeform design surface.

## Client Data Flow

The Flutter app uses Supabase directly for auth and tenant-owned CRUD data that is protected by RLS. The app sends protected generation and compliance requests to the backend API with the user's Supabase JWT. The app must never contain provider API keys or Supabase service-role keys.

Primary app areas:

- Session gate, sign in, sign up, and sign out.
- Onboarding for doctor, clinic, specialty, services, and contact basics.
- Dashboard with campaign progress and next actions.
- Campaign/calendar CRUD for 7, 15, and 30 day campaigns.
- Content item review, edit, status, copy, and export.
- Brand kit editing and deterministic preview.

## Backend API Flow

The API validates configuration at boot, attaches request IDs, uses redacted structured logs, validates all requests with shared contracts, and returns standard envelopes.

Generation flow:

1. Verify Supabase JWT.
2. Resolve clinic context server-side.
3. Reject obvious patient-identifiable input.
4. Enforce quota and idempotency where relevant.
5. Call the provider-agnostic LLM adapter.
6. Validate structured output.
7. Run rules-first compliance review.
8. Write `ai_generation_logs` and related output records.
9. Return a safe response envelope.

The initial provider is fake and deterministic for tests and local development. Real providers must be added behind the adapter without changing route handlers or Flutter screens.

## Supabase Data Model

Supabase uses `auth.users.id` as the identity source. The solo-clinic MVP uses `clinics.owner_user_id` for ownership. Tenant-owned tables reference `clinic_id` and enforce RLS through ownership policies.

Initial tables:

- `user_profiles`
- `clinics`
- `doctor_profiles`
- `brand_kits`
- `clinic_services`
- `specialties`
- `content_campaigns`
- `content_items`
- `generated_assets`
- `ai_generation_logs`
- `usage_credits`
- `content_compliance_reviews`

## Privacy and Medical Safety

PraxisLume generates general education and acquisition content only. The product must not request patient names, phone numbers, reports, medical record numbers, case histories, or identifiable stories in generation prompts. Logs must not store secrets, raw auth tokens, or patient-identifiable content.

Compliance checks are conservative and advisory. They can flag, block, or rewrite content, but they must not claim legal, ethical, or medical compliance guarantees.

## Local Development

Windows contributors should use `npm.cmd` because PowerShell can block `npm.ps1`. The Supabase CLI is required for database work and may need installation before migrations can be verified locally.
