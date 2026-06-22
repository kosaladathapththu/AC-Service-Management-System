@echo off
setlocal
title AC Service Management System
color 0A

set "AC_SYSTEM_ROOT=%~dp0dist"
set "AC_SYSTEM_PORT=8080"

if not exist "%AC_SYSTEM_ROOT%\index.html" (
  echo.
  echo  ERROR: The production build was not found.
  echo  Expected file: "%AC_SYSTEM_ROOT%\index.html"
  echo.
  echo  Run "npm run build" first, then copy this BAT file beside the dist folder.
  echo.
  pause
  exit /b 1
)

echo.
echo  =====================================================
echo       AC SERVICE MANAGEMENT SYSTEM
echo  =====================================================
echo.
echo  Starting local server...
echo  Application: http://127.0.0.1:%AC_SYSTEM_PORT%
echo.
echo  Keep this window open while using the system.
echo  Press Ctrl+C to stop the application.
echo.

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference = 'Stop';" ^
  "$root = [IO.Path]::GetFullPath($env:AC_SYSTEM_ROOT);" ^
  "$port = [int]$env:AC_SYSTEM_PORT;" ^
  "$url = 'http://127.0.0.1:' + $port + '/';" ^
  "$listener = [Net.HttpListener]::new();" ^
  "$listener.Prefixes.Add($url);" ^
  "try { $listener.Start() } catch { Write-Host ''; Write-Host ('  Could not start server: ' + $_.Exception.Message) -ForegroundColor Red; Write-Host ('  Port ' + $port + ' may already be in use.'); Read-Host '  Press Enter to close'; exit 1 };" ^
  "Write-Host ('  Server ready: ' + $url) -ForegroundColor Green;" ^
  "Start-Process $url;" ^
  "$mime = @{ '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.json'='application/json; charset=utf-8'; '.svg'='image/svg+xml'; '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.gif'='image/gif'; '.ico'='image/x-icon'; '.webp'='image/webp'; '.woff'='font/woff'; '.woff2'='font/woff2'; '.txt'='text/plain; charset=utf-8' };" ^
  "try { while ($listener.IsListening) { $context = $listener.GetContext(); try { $requestPath = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath).TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar); $file = if ([string]::IsNullOrWhiteSpace($requestPath)) { Join-Path $root 'index.html' } else { Join-Path $root $requestPath }; $fullPath = [IO.Path]::GetFullPath($file); if (-not $fullPath.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) { $context.Response.StatusCode = 403; $bytes = [Text.Encoding]::UTF8.GetBytes('Forbidden') } else { if (-not [IO.File]::Exists($fullPath)) { $fullPath = Join-Path $root 'index.html' }; $extension = [IO.Path]::GetExtension($fullPath).ToLowerInvariant(); $context.Response.ContentType = if ($mime.ContainsKey($extension)) { $mime[$extension] } else { 'application/octet-stream' }; $context.Response.StatusCode = 200; $context.Response.Headers['Cache-Control'] = 'no-cache'; $bytes = [IO.File]::ReadAllBytes($fullPath) }; $context.Response.ContentLength64 = $bytes.Length; $context.Response.OutputStream.Write($bytes, 0, $bytes.Length) } catch { $context.Response.StatusCode = 500 } finally { $context.Response.OutputStream.Close() } } } finally { $listener.Stop(); $listener.Close() }"

if errorlevel 1 (
  echo.
  echo  The AC Service Management System stopped with an error.
  pause
)

endlocal
