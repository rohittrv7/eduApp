# Deployment Guide

## Frontend — Vercel

1. Import the repo in Vercel, set **Root Directory** to `apps/web`
2. Set all env vars from `apps/web/.env.production.example` in Vercel dashboard
3. Vercel auto-deploys on push to `main`

## Backend — Render / Railway

### Render (Docker)
1. New Web Service → Docker → point to repo root
2. Set **Dockerfile Path** to `apps/api/Dockerfile`
3. Add all env vars from `apps/api/.env.example`
4. Health check path: `/api/v1/health`

### Railway
1. New Project → Deploy from GitHub
2. Set **Build Command**: `pnpm install --frozen-lockfile && pnpm --filter @educational/api build`
3. Set **Start Command**: `node apps/api/dist/main`
4. Add env vars from `apps/api/.env.example`

## Cloudflare CDN

1. Add your Vercel domain to Cloudflare (DNS → Proxied)
2. **Cache Rules** (Cloudflare dashboard → Caching → Cache Rules):
   - `/_next/static/*` → Cache Everything, Edge TTL: 1 year
   - `/icons/*`, `/fonts/*` → Cache Everything, Edge TTL: 1 day
   - `/sw.js`, `/manifest.json` → Bypass Cache
3. **Minification**: Speed → Optimization → enable JS/CSS/HTML minification
4. **Rocket Loader**: disable (breaks Next.js hydration)

## Database Migrations

Run after each deploy:
```bash
pnpm --filter @educational/api migration:run
```

## CI/CD

GitHub Actions runs on every PR and push to `main`/`develop`:
- Lint → Type-check → Build → Test
- PRs are blocked from merging if any check fails
