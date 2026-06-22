$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$dbContainerName = "supabase_db_praxislume-local"
$rlsScript = Join-Path $repoRoot "supabase/tests/rls_cross_clinic.sql"

$runningContainer = docker ps --filter "name=^/$dbContainerName$" --format "{{.Names}}"
if ($runningContainer -ne $dbContainerName) {
  throw "Supabase DB container '$dbContainerName' is not running. Run 'npx.cmd supabase start' first."
}

Get-Content -Raw -LiteralPath $rlsScript |
  docker exec -i $dbContainerName psql -U postgres -d postgres -v ON_ERROR_STOP=1
