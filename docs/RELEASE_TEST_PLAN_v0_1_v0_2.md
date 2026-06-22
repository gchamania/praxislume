# PraxisLume Release Test Plan v0.1 + Light v0.2

## Documentation

- Canonical docs are populated.
- Duplicate prefixed docs are removed.
- `docs/IMPLEMENTATION_STATUS.md` matches repository state.

## Flutter

- Dart format, Flutter analyze, widget tests, and web build pass.
- Session gate routes anonymous and authenticated states.
- Onboarding validates required doctor, clinic, specialty, service, and contact fields.
- Campaign calendar displays empty, loading, error, and populated states.
- Content item edit, status, copy, and export flows preserve user edits.
- Brand kit form validates colors, URLs, and contact fields.

## API

- Lint, typecheck, and tests pass.
- Health and readiness routes return standard envelopes.
- Protected routes reject missing auth.
- Requests and provider outputs are validated.
- Fake provider supports campaign plan, caption, reel script, and tone rewrite.
- Patient-identifiable text is rejected before provider calls.
- Compliance review flags unsafe claims.
- Logs redact auth headers and secrets.

## Supabase

- Migrations apply to an empty database.
- Seed data is repeatable.
- RLS prevents Clinic A from reading or mutating Clinic B records.
- Logo storage policies prevent cross-clinic reads.

## Smoke Flow

1. Create a user.
2. Complete onboarding.
3. Save a brand kit.
4. Create a 30-day campaign.
5. Generate campaign ideas with the fake provider.
6. Review compliance flags.
7. Edit one content item.
8. Copy caption, CTA, and reel script.
9. Export a campaign package.
