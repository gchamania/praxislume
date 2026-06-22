$ErrorActionPreference = "Stop"

npm.cmd run lint
npm.cmd run typecheck
npm.cmd test

Push-Location "apps/praxislume_app"
try {
  dart format --set-exit-if-changed .
  flutter analyze
  flutter test
  flutter build web
} finally {
  Pop-Location
}

powershell -ExecutionPolicy Bypass -File "scripts/verify_docs.ps1"
