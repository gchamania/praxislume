# PraxisLume Database

## Identity and Ownership

Supabase `auth.users` is the identity source. `user_profiles.id` references `auth.users.id`. The solo-clinic MVP grants ownership through `clinics.owner_user_id`.

Tenant-owned records use `clinic_id`. RLS policies check that the authenticated user owns the clinic.

## Tables

- `user_profiles`: public profile data for an authenticated user.
- `clinics`: solo-clinic tenant root.
- `doctor_profiles`: doctor identity, qualifications, specialty, and onboarding state.
- `brand_kits`: clinic brand settings and logo path.
- `clinic_services`: clinic-provided service labels.
- `specialties`: safe seed list of supported specialties.
- `content_campaigns`: campaign shell for 7, 15, or 30 days.
- `content_items`: planned or drafted posts with category, status, copy, CTA, script, and notes.
- `generated_assets`: references to deterministic future exports or storage assets.
- `ai_generation_logs`: audit trail for every AI generation attempt.
- `usage_credits`: plan-neutral usage counters.
- `content_compliance_reviews`: rules/model review records tied to content hashes.

## RLS Rules

Authenticated users may read or mutate only their own clinic records. Public seed tables such as `specialties` are readable by authenticated users. Service-role access is server-only.

## Migration Rules

- Add forward-only migrations.
- Do not edit migrations after they are applied to shared environments.
- Keep seed data safe, idempotent, and free of medical claims.
- Do not add patient names, reports, phone numbers, medical record numbers, diagnoses, case histories, or patient-story fields.

## Verification

`supabase/tests/rls_cross_clinic.sql` creates two users and clinics, then proves one clinic owner cannot access the other clinic's records through RLS.
