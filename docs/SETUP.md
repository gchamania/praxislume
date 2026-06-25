# PraxisLume Setup

## Prerequisites

- Git
- Flutter 3.32 or newer
- Node.js 22 or newer
- npm 10 or newer
- Docker Desktop for local Supabase
- Supabase CLI for database work, installed locally by this repo's npm dev dependency

On Windows PowerShell, use `npm.cmd` instead of `npm` if script execution policy blocks `npm.ps1`.

## Install Dependencies

From the repository root:

```powershell
npm.cmd install
flutter pub get apps/praxislume_app
```

If `flutter pub get apps/praxislume_app` is not supported by the local Flutter version, run:

```powershell
Set-Location apps/praxislume_app
flutter pub get
```

## Environment

Copy `.env.example` to `.env` for root-level local notes if needed.

Copy `services/api/.env.example` to `services/api/.env` for API development.

All values in example files are fake. Do not commit real secrets.

Keep provider keys and the Supabase service-role key server-only. The root
`.env.example` is for Flutter/public app settings; live AI configuration
belongs only in `services/api/.env` or deployment secrets.

For fake-provider staging, use `.env.staging.fake.example` as the environment
checklist and follow `docs/STAGING_DEPLOYMENT.md`. The first staging pass keeps
text generation deterministic and enables visual asset generation only through
`IMAGE_PROVIDER=fake`.

## Supabase

The repo pins the Supabase CLI as a root dev dependency. Prefer the local CLI:

Local commands:

```powershell
npx.cmd supabase --version
npx.cmd supabase start
npx.cmd supabase db reset
npm.cmd run supabase:test:rls
```

`npm.cmd run supabase:test:rls` pipes `supabase/tests/rls_cross_clinic.sql` into `psql` inside the local Supabase database container. A host `psql` install is not required.

The first `npx.cmd supabase start` can take several minutes because Docker pulls large Supabase images. On Windows, Supabase may warn that analytics needs the Docker daemon exposed on `tcp://localhost:2375`; this does not block database/RLS verification. If the first start times out during image extraction or health checks, rerun `npx.cmd supabase start` after Docker settles.

`supabase status` prints local development keys. Treat them as local-only output and never copy service-role or provider secrets into Flutter or committed files.

The Flutter app uses the anon key. The backend API may use the service-role key only on the server. Never put the service-role key in Flutter.

## Flutter With Supabase

Start local Supabase, then pass the local project URL and anon key to Flutter with dart defines:

```powershell
Set-Location apps/praxislume_app
flutter run -d chrome --dart-define=SUPABASE_URL=http://127.0.0.1:54321 --dart-define=SUPABASE_ANON_KEY=<local-anon-key>
```

Get the local anon key from `npx.cmd supabase status`. Use only the anon key in Flutter. The service-role key remains server-only.

When no Supabase session exists, the app's demo account path uses the in-memory repository. After signing in with Supabase email/password, onboarding, brand kit edits, campaign generation, and content item edits use Supabase tables under RLS.

## Optional Live AI

Local development defaults to the fake provider:

```env
AI_PROVIDER=fake
CAMPAIGN_PLAN_PROVIDER=fake
CAPTION_PROVIDER=fake
REEL_SCRIPT_PROVIDER=fake
TONE_REWRITE_PROVIDER=fake
```

To test live AI through the backend, set route-specific providers in
`services/api/.env`:

```env
CAMPAIGN_PLAN_PROVIDER=openai_compatible
OPENAI_COMPATIBLE_BASE_URL=https://api.openai.com/v1
OPENAI_COMPATIBLE_API_KEY=<server-only-provider-key>
OPENAI_COMPATIBLE_CAMPAIGN_MODEL=<campaign-model>
```

For caption, reel script, and tone rewrite routes also set:

```env
CAPTION_PROVIDER=openai_compatible
REEL_SCRIPT_PROVIDER=openai_compatible
TONE_REWRITE_PROVIDER=openai_compatible
OPENAI_COMPATIBLE_COPY_MODEL=<copy-model>
```

`OPENAI_COMPATIBLE_BASE_URL` can point at a direct provider API, LiteLLM Proxy,
or Vercel AI Gateway. See `docs/AI_ROUTING.md`.

For DeepSeek V4 local smoke:

```env
OPENAI_COMPATIBLE_BASE_URL=https://api.deepseek.com
OPENAI_COMPATIBLE_CAMPAIGN_MODEL=deepseek-v4-pro
OPENAI_COMPATIBLE_COPY_MODEL=deepseek-v4-flash
OPENAI_COMPATIBLE_THINKING=disabled
OPENAI_COMPATIBLE_REASONING_EFFORT=high
```

Keep the DeepSeek key only in `OPENAI_COMPATIBLE_API_KEY` inside
`services/api/.env` or deployment secrets.

## Optional Visual Asset Pilot

Visual asset generation is disabled by default. For local staging fake-image
smoke, set these in `services/api/.env`:

```env
IMAGE_GENERATION_ENABLED=true
IMAGE_PROVIDER=fake
IMAGE_GENERATION_DAILY_LIMIT=1
```

For fal.ai staging smoke, keep the key server-only in `services/api/.env`:

```env
IMAGE_GENERATION_ENABLED=true
IMAGE_PROVIDER=fal_ai
FAL_KEY=<server-only-fal-key>
FAL_IMAGE_MODEL=fal-ai/flux/schnell
FAL_RUN_BASE_URL=https://fal.run
IMAGE_GENERATION_DAILY_LIMIT=1
```

For a single OpenAI image smoke test, keep the key server-only in
`services/api/.env`:

```env
IMAGE_GENERATION_ENABLED=true
IMAGE_PROVIDER=openai_image
OPENAI_IMAGE_API_KEY=<server-only-openai-key>
OPENAI_IMAGE_MODEL=gpt-image-1-mini
OPENAI_IMAGE_BASE_URL=https://api.openai.com/v1
IMAGE_GENERATION_DAILY_LIMIT=1
```

Do not put `FAL_KEY`, `OPENAI_IMAGE_API_KEY`, provider keys, or the Supabase service-role key
in Flutter dart defines, `.env.example`, or any committed file with real values.
The Flutter app calls the Fastify API with the user's Supabase JWT; the backend
downloads or decodes provider image outputs and stores the deterministic
branded SVG in the private `generated-assets` bucket.

## Verification

Run:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:api
npm.cmd run test:contracts
Set-Location apps/praxislume_app
dart format --set-exit-if-changed .
flutter analyze
flutter test
flutter build web
```
