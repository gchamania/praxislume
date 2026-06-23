# PraxisLume Pilot Demo Script

This script demonstrates the v0.1 plus light v0.2 pilot path:

> 30 days of branded medical content in 30 minutes.

Use local Supabase, the Fastify API, and the fake provider. Do not paste service-role keys into Flutter, source files, screenshots, or committed docs.

## Scope Boundary

Show:

- Supabase Auth sign up/sign in.
- Doctor and clinic onboarding.
- Brand kit save with logo upload.
- Backend-gated 30-day campaign generation.
- AI generation logs and compliance review persistence.
- Calendar/library/content detail review.
- Manual copy/export.
- Reload persistence.

Do not show as active MVP features:

- Social publishing.
- WhatsApp Business automation.
- Avatar or AI video generation.
- Freeform design canvas.
- CRM workflows.
- Advanced analytics.

## 1. Start Local Supabase

From the repository root:

```powershell
npx.cmd supabase start
npx.cmd supabase db reset
npm.cmd run supabase:test:rls
npx.cmd supabase status
```

From `supabase status`, keep these values locally:

- `API_URL`
- `PUBLISHABLE_KEY` or local anon key for Flutter
- `SERVICE_ROLE_KEY` for the backend API only

## 2. Start The Backend API

Open a second terminal at the repository root:

```powershell
$env:NODE_ENV='development'
$env:PORT='8787'
$env:HOST='127.0.0.1'
$env:SUPABASE_URL='http://127.0.0.1:54321'
$env:SUPABASE_ANON_KEY='<local-anon-or-publishable-key>'
$env:SUPABASE_SERVICE_ROLE_KEY='<local-service-role-key-server-only>'
$env:AI_PROVIDER='fake'
$env:DEFAULT_DRAFT_MODEL='fake-draft-v1'
$env:GENERATION_TIMEOUT_MS='5000'
$env:GENERATION_DAILY_LIMIT='50'
npm.cmd run dev -w @praxislume/api
```

Verify:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8787/ready
```

Expected result: `ok: true` and provider `fake`.

## 3. Start The Flutter Web App

Open a third terminal:

```powershell
Set-Location apps/praxislume_app
flutter run -d chrome `
  --dart-define=SUPABASE_URL=http://127.0.0.1:54321 `
  --dart-define=SUPABASE_ANON_KEY=<local-anon-or-publishable-key> `
  --dart-define=API_BASE_URL=http://127.0.0.1:8787
```

Use only the local anon or publishable key in Flutter.

## 4. Demo Flow

1. Open `/signup`.
2. Create a demo doctor account:
   - Email: `doctor-demo-<date>@praxislume.local`
   - Password: any local-only test password.
3. Complete onboarding:
   - Doctor: `Dr Asha Mehta`
   - Qualification: `MBBS, MS ENT`
   - Specialty: `ENT`
   - Clinic: `Asha ENT Clinic`
   - Locality: `Aundh`
   - City: `Pune`
   - Services: `Hearing care`, `Sinus care`
   - Phone/WhatsApp: local demo number.
4. Go to Brand Settings:
   - Set primary color.
   - Set CTA: `Book an ENT consultation`.
   - Upload a small PNG/JPG/WebP logo.
   - Save brand kit.
   - Confirm the preview shows the logo/CTA.
5. Go to Generate Content:
   - Generate the 30-day campaign.
   - Explain that Flutter sends the Supabase JWT to Fastify.
   - Explain that Fastify uses the fake provider for local pilot safety.
6. Go to Calendar and Content Library:
   - Show 30 generated items.
   - Show specialty-aware titles/captions/reel scripts.
   - Point out review/export only; there is no social publishing.
7. Open a content detail:
   - Edit the caption.
   - Save.
   - Copy the post package.
8. Reload the app:
   - Sign in again if needed.
   - Confirm onboarding, brand kit/logo, campaign, and edited content remain.

## 5. Evidence Checks

After generation, use Supabase Studio or SQL to confirm backend audit rows:

```sql
select generation_type, provider, model, status, created_at
from public.ai_generation_logs
order by created_at desc
limit 10;
```

Run a compliance review through the app smoke path or API, then check:

```sql
select status, issue_codes, reviewed_content_version_hash, created_at
from public.content_compliance_reviews
order by created_at desc
limit 10;
```

Storage isolation has already been verified by:

```powershell
npm.cmd run supabase:test:rls
```

## 6. Expected Talk Track

PraxisLume is not a Canva clone and not a scheduler. The MVP proof is that a doctor can enter clinic identity, specialty, services, local context, brand kit, logo, tone, CTA, and disclaimer, then receive a reviewable 30-day patient-education campaign through a backend-audited generation path.

The local fake provider proves the product pipeline safely:

- The frontend never receives provider or service-role keys.
- The backend validates requests.
- Patient-identifiable generation inputs are blocked before provider calls.
- Every generation attempt is logged.
- Content remains doctor-reviewed and manually exported.

## 7. Cleanup

Stop the Flutter run, API server, and any temporary static server.

Optional:

```powershell
npx.cmd supabase stop
```
