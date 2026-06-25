# PraxisLume Staging Deployment

This runbook is for the first v0.3 staging pass: deploy the current visual asset
pipeline with deterministic fake providers only. It keeps live OpenAI image and
fal.ai providers disabled until a later manually enabled smoke pass.

## Target Shape

- Flutter web is built with staging Supabase anon config and the staging API URL.
- Fastify API runs with staging Supabase server secrets and fake generation providers.
- Supabase staging uses the committed migrations and private storage buckets.
- Visual asset generation is enabled only with `IMAGE_PROVIDER=fake`.
- Production is not deployed or promoted from this pass.

## Required Environments

Create separate staging resources from production:

- Staging Supabase project.
- Staging API runtime.
- Staging Flutter web host.

Use `.env.staging.fake.example` as the checklist for provider envs. Put real
values only in the host's secret manager or local shell. Never commit real
Supabase service-role, OpenAI, DeepSeek, or fal.ai keys.

Client-visible Flutter build values:

```env
SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_ANON_KEY=your-staging-supabase-anon-key
API_BASE_URL=https://your-staging-api.example.com
```

Server-only API runtime values:

```env
NODE_ENV=production
SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_ANON_KEY=your-staging-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=<server-only-staging-service-role-key>
AI_PROVIDER=fake
CAMPAIGN_PLAN_PROVIDER=fake
CAPTION_PROVIDER=fake
REEL_SCRIPT_PROVIDER=fake
TONE_REWRITE_PROVIDER=fake
IMAGE_GENERATION_ENABLED=true
IMAGE_PROVIDER=fake
IMAGE_GENERATION_DAILY_LIMIT=5
```

Leave these unset or empty for this sprint:

```env
FAL_KEY=
OPENAI_IMAGE_API_KEY=
```

## Build Commands

Run from the repository root before deploying:

```powershell
npm.cmd ci
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run docs:check
```

Build Flutter web with staging public config:

```powershell
Set-Location apps/praxislume_app
flutter pub get
dart format --set-exit-if-changed .
flutter analyze
flutter test
flutter build web `
  --dart-define=SUPABASE_URL=$env:SUPABASE_URL `
  --dart-define=SUPABASE_ANON_KEY=$env:SUPABASE_ANON_KEY `
  --dart-define=API_BASE_URL=$env:API_BASE_URL
```

## Database

Apply migrations to the staging Supabase project using Supabase's normal remote
migration flow. For local confidence before deploy, run:

```powershell
npm.cmd run supabase:test:rls
```

The staging API must use the service-role key only on the server. Flutter must
receive only the anon key.

## Health Checks

After the API deploy:

- `GET /health` returns an OK envelope with `status=ok`.
- `GET /ready` returns an OK envelope with `provider=fake`.

After the Flutter deploy:

- `/signin` loads with page title `PraxisLume`.
- Sign in with the dentist demo account.
- Dashboard shows the demo clinic context.
- Generate or open one content item.
- Generate one branded asset with the fake provider.
- Confirm the SVG preview renders in Content Detail.

## Rollback

Rollback only the staging runtime or static deployment. Do not roll back database
migrations unless a migration has been verified as destructive and a specific
database rollback plan exists.

If visual generation causes trouble, set:

```env
IMAGE_GENERATION_ENABLED=false
IMAGE_PROVIDER=fake
```

Then redeploy or restart the API. Text generation remains fake and deterministic.

## Production Gate

Do not promote this staging deployment to production until:

- Full dentist demo QA passes.
- No provider/service-role secrets appear in Flutter or logs.
- RLS checks pass against local or staging-equivalent database.
- OpenAI image smoke, if used later, is manually enabled and capped.
- FAL remains disabled until the external account lock is resolved.
