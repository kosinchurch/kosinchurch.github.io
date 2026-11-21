# Local preview server for Windows (no installation needed).
# Usage:  powershell -NoProfile -ExecutionPolicy Bypass -File tools\serve.ps1 -Port 8080
# Then open http://localhost:8080/ in your browser. Press Ctrl+C to stop.
param([int]$Port = 8080)

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.js' = 'application/javascript; charset=utf-8'; '.json' = 'application/json; charset=utf-8'
  '.svg' = 'image/svg+xml'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'; '.gif' = 'image/gif'; '.ico' = 'image/x-icon'; '.pdf' = 'application/pdf'
  '.xml' = 'application/xml; charset=utf-8'; '.txt' = 'text/plain; charset=utf-8'; '.woff2' = 'font/woff2'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/  (Ctrl+C to stop)"

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    try {
      $path = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
      if ($path.EndsWith('/')) { $path += 'index.html' }
      $full = [System.IO.Path]::GetFullPath((Join-Path $root ($path.TrimStart('/').Replace('/', '\'))))
      if ($full.StartsWith($root + '\') -and (Test-Path -LiteralPath $full -PathType Leaf)) {
        $ext = [System.IO.Path]::GetExtension($full).ToLower()
        $type = $mime[$ext]
        if (-not $type) { $type = 'application/octet-stream' }
        $bytes = [System.IO.File]::ReadAllBytes($full)
        $ctx.Response.ContentType = $type
        $ctx.Response.ContentLength64 = $bytes.Length
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      } else {
        $ctx.Response.StatusCode = 404
        $nf = [System.Text.Encoding]::UTF8.GetBytes('404 Not Found')
        $ctx.Response.OutputStream.Write($nf, 0, $nf.Length)
      }
    } catch { }
    try { $ctx.Response.OutputStream.Close() } catch { }
  }
} finally { $listener.Stop() }
