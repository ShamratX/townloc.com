@echo off
REM Rebuild production Tailwind CSS (no CDN). Design-safe: scans all HTML.
cd /d "%~dp0.."
npx --yes tailwindcss@3.4.19 -i "./assets/tailwind.input.css" -o "./assets/tailwind.min.css" -c "./tailwind.config.js" --minify
echo Done. Bump tailwind.min.css?v= on HTML pages after changes.
