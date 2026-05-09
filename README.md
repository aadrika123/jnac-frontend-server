# jnac-frontend-server

Tiny Express server (port **3501**) serving multiple JNAC SPAs (survey-frontend, swm-mobile, …) from `/opt/frontend_builds/` on:

| Branch    | Server                         | Domain                                  |
| --------- | ------------------------------ | --------------------------------------- |
| `staging` | `aadrika@172.18.1.52`          | `staging-jnac.jharkhandegovernance.com` |
| `main`    | `akola_production@172.18.1.51` | `jnac.jharkhandegovernance.com`         |

## Routes (see [`routes.json`](./routes.json))

| URL prefix          | Build directory                 | Source repo                        |
| ------------------- | ------------------------------- | ---------------------------------- |
| `/`                 | (302 redirect → `/survey-app/`) | —                                  |
| `/survey-app/*`     | `jnac_survey_build/`            | `aadrika123/j-nac-survey-frontend` |
| `/juidco-swm-app/*` | `jnac_swm_app_build/`           | `aadrika123/j-nac-swm-mobile`      |
| `/jnac-swm-app/*`   | `jnac_swm_app_build/` (alias)   | `aadrika123/j-nac-swm-mobile`      |

> Note: `j-nac-swm-mobile`'s `src/` has 56 hardcoded `/juidco-swm-app/` route paths. We expose the same build under both `/juidco-swm-app/` (legacy) and `/jnac-swm-app/` (preferred, JNAC branding) — assets are root-relative (`/assets/*`) so both prefixes load the SPA correctly. A code-side refactor to flip the canonical basename is tracked in KNOWN_BUGS.

## How a build lands here

Each SPA's own Jenkins pipeline (e.g. `j-nac-survey-frontend`, `j-nac-swm-mobile`) builds on the branch matching the target environment and rsyncs its `dist/` (or `build/`) into the appropriate `/opt/frontend_builds/<dir>/` on the right server. This server then serves whatever it finds there — no rebuild here.

Adding a new app = add an entry to `routes.json` + restart PM2.

## Server-local install (one-time, per host)

```bash
ssh aadrika@172.18.1.52   # or akola_production@172.18.1.51
cd ~ && git clone https://github.com/aadrika123/jnac-frontend-server.git -b staging   # main on srv51
cd jnac-frontend-server
npm ci --omit=dev
PORT=3501 pm2 start server.js --name jnac-frontend-server
pm2 save
```

Then point the host nginx vhost (`staging-jnac.jharkhandegovernance.com` / `jnac.jharkhandegovernance.com`) `location /` block at `proxy_pass http://127.0.0.1:3501;`.

## Update flow

1. Push to `staging` (or `main`) of this repo.
2. GitHub webhook triggers Jenkins job `jnac-frontend-server`.
3. Jenkins SSHes to the right server, `git pull`, `pm2 restart`.

## Health

`GET /server-health` → `{"success":true,"port":3501,"routes":N}`
