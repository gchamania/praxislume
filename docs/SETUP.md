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
