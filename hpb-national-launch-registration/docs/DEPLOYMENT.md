# Netlify Deployment

## Option A — connected Git repository
1. Push this project to a repository.
2. In Netlify: **Add new site ▸ Import an existing project**.
3. Build command: `npm run build`  ·  Publish directory: `dist`
   (already declared in `netlify.toml`).
4. Add environment variables (below), then **Deploy**.

## Option B — drag and drop
1. `npm run build` locally.
2. Drag the `dist` folder into Netlify. (Serverless functions require the Git or
   CLI flow; drag-and-drop deploys the static site only.)

## Environment variables (Site configuration ▸ Environment variables)

**Server-side (never exposed to the browser):**
- `GOOGLE_APPS_SCRIPT_URL` — the Apps Script `/exec` URL
- `REGISTRATION_API_TOKEN` — must equal the Apps Script `API_TOKEN`
- `PUBLIC_SITE_URL` — final Netlify address
- `REGISTRATION_OPEN` — `true` / `false`
- `REGISTRATION_DEADLINE` — ISO date-time
- `TURNSTILE_SECRET_KEY` — optional Cloudflare Turnstile secret
- `TURNSTILE_SITE_KEY` — optional

**Frontend (public, `VITE_` prefix):**
- `VITE_PUBLIC_SITE_URL`
- `VITE_AGENDA_URL=https://national-launch-agenda.netlify.app`
- `VITE_TURNSTILE_SITE_KEY` — optional
- `VITE_REGISTRATION_OPEN` — `true` / `false`

After the first deploy, set `VITE_PUBLIC_SITE_URL` to the real address and
redeploy so it is baked into the build.

## Verify after deploy
- Landing page loads; **Register for the Event** works.
- **View Programme Agenda** opens the separate agenda app in a new tab.
- Submit a test registration; confirm a reference `HPB-2026-000001` appears in
  the Sheet and (if enabled) a confirmation email arrives.
- Confirm the reception interface loads for an allowlisted account and rejects
  others.
- Registration/confirmation responses carry `Cache-Control: no-store`.
