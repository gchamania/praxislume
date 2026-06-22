$ErrorActionPreference = "Stop"

$requiredDocs = @(
  "docs/SOURCE_OF_TRUTH.md",
  "docs/ARCHITECTURE.md",
  "docs/CURRENT_RELEASE.md",
  "docs/DECISIONS.md",
  "docs/CODEX_AGENT_PROMPTS.md",
  "docs/SETUP.md",
  "docs/DATABASE.md",
  "docs/API.md",
  "docs/RELEASE_TEST_PLAN_v0_1_v0_2.md",
  "docs/IMPLEMENTATION_STATUS.md"
)

foreach ($doc in $requiredDocs) {
  if (!(Test-Path $doc)) {
    throw "Missing required doc: $doc"
  }
  if ((Get-Item $doc).Length -eq 0) {
    throw "Empty required doc: $doc"
  }
}

$duplicates = Get-ChildItem "docs" -Filter "PraxisLume_*.md" -ErrorAction SilentlyContinue
if ($duplicates.Count -gt 0) {
  throw "Duplicate prefixed docs remain: $($duplicates.Name -join ', ')"
}

Write-Output "Docs verification passed."
