# Change the site domain in every place it is written (share-preview image address in each page,
# sitemap.xml, robots.txt, and the docs). Run it from the project folder in PowerShell (Windows):
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\set-domain.ps1 -Domain https://www.kosinchurch.com
#
# Check first without changing anything:
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\set-domain.ps1 -Domain https://www.kosinchurch.com -DryRun
#
# The domain must start with https:// and has no trailing path (example: https://www.example.com).
# The pages themselves work on any address (all links are relative), so this only matters for
# link previews (KakaoTalk, etc.) and search engines.
param(
  [Parameter(Mandatory = $true)][string]$Domain,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)

$new = $Domain.Trim().TrimEnd('/')
if ($new -notmatch '^https://[A-Za-z0-9.-]+$') {
  throw "Domain must look like https://www.example.com (https, host name only). You gave: $Domain"
}

# Find the domain currently written in robots.txt (Sitemap line)
$robots = Join-Path $root 'robots.txt'
$m = [regex]::Match([System.IO.File]::ReadAllText($robots, $utf8), 'Sitemap:\s*(https://[^/\s]+)')
if (-not $m.Success) { throw 'Cannot find the current domain in robots.txt (Sitemap line).' }
$cur = $m.Groups[1].Value

if ($cur -eq $new) { Write-Host "Already set to $new. Nothing to do."; return }

$files = Get-ChildItem -Path $root -Recurse -File -Include *.html, *.xml, *.txt, *.md |
  Where-Object { $_.FullName -notmatch '\\\.(claude|git)\\' }

$changed = 0
foreach ($f in $files) {
  $text = [System.IO.File]::ReadAllText($f.FullName, $utf8)
  if ($text.Contains($cur)) {
    $count = ([regex]::Matches($text, [regex]::Escape($cur))).Count
    Write-Host ('{0,3} x  {1}' -f $count, $f.FullName.Substring($root.Length + 1))
    if (-not $DryRun) { [System.IO.File]::WriteAllText($f.FullName, $text.Replace($cur, $new), $utf8) }
    $changed++
  }
}

if ($DryRun) { Write-Host "DRY RUN: $changed file(s) would change from $cur to $new. Nothing was written." }
else { Write-Host "Done: $changed file(s) changed from $cur to $new." }
