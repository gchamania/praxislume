# PraxisLume Setup

## Prerequisites

- Git
- Flutter 3.32 or newer
- Node.js 22 or newer
- npm 10 or newer
- Supabase CLI for database work

On Windows PowerShell, use `npm.cmd` instead of `npm` if script execution policy blocks `npm.ps1`.

## Install Dependencies

From the repository root:

```powershell
npm.cmd install
npm.cmd --prefix packages/contracts install
npm.cmd --prefix services/api install
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

Install the Supabase CLI if `supabase --version` is not found.

Local commands:

```powershell
supabase start
supabase db reset
```

The Flutter app uses the anon key. The backend API may use the service-role key only on the server. Never put the service-role key in Flutter.

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
