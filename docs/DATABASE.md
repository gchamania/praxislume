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

RLS policies must be paired with explicit grants for the `authenticated` role. Without table privileges, Postgres rejects access before evaluating the policy. Tenant-owned CRUD tables receive select/insert/update/delete grants guarded by ownership policies; `ai_generation_logs` is select-only for clinic owners because API/server code writes generation logs.

Logo storage uses the `clinic-logos` bucket. Object names must begin with the clinic UUID, for example `<clinic_id>/logo.png`. Storage policies must qualify `storage.objects.name` inside subqueries so the folder check cannot accidentally resolve to `clinics.name`.

## Migration Rules

- Add forward-only migrations.
- Do not edit migrations after they are applied to shared environments.
- Keep seed data safe, idempotent, and free of medical claims.
- Do not add patient names, reports, phone numbers, medical record numbers, diagnoses, case histories, or patient-story fields.

## Verification

`supabase/tests/rls_cross_clinic.sql` creates two users and clinics, then proves one clinic owner cannot read or update the other clinic's campaign records. It also verifies that the owner can create a logo object under their own clinic path and cannot read or update another clinic's logo object.

Run it locally with:

```powershell
npm.cmd run supabase:test:rls
```
