# Stride: deploy guide

Files: `index.html` (the app), `netlify/functions/coach.mjs` (AI coach backend), `manifest.webmanifest` + `icon.svg` (install as app), `netlify.toml`.

1. Create an API key at console.anthropic.com and set a monthly spend limit there.
2. Put this folder in a GitHub repository.
3. On netlify.com choose "Add new site", then "Import from Git", and pick the repo. No build command, publish directory `.`.
4. In Site settings, Environment variables, add `ANTHROPIC_API_KEY` with your key. Redeploy.
5. In Domain management, add your own domain and follow the DNS steps.

Test: open the site, finish setup, tap "Ask coach". If it says it couldn't reach the coach, check the key and the function logs in Netlify.
