# Deploy

**Backend:** GCP e2-micro VM — Docker Compose (`docker-compose.prod.yml`).  
**Frontend:** Vercel — root directory `frontend/`.  
**HTTPS:** Cloudflare quick tunnel on the VM for Spring Boot only (`:8080`). FastAPI stays internal to Docker and is not exposed.

Full numbered runbook: copy [`DEPLOY.local.md.example`](DEPLOY.local.md.example) → `DEPLOY.local.md` (gitignored).

## First time

1. GCP VM (e2-micro, Ubuntu, firewall **8080** only)
2. VM: clone repo, `.env`, `docker compose -f docker-compose.prod.yml up -d --build`
3. VM: `nohup cloudflared …` for `:8080` (see example doc §3)
4. Vercel: `frontend/`, set `VITE_API_BASE_URL` + `VITE_WS_URL` to the Spring tunnel URL
5. GitHub Actions secrets: `VM_HOST`, `VM_USER`, `VM_SSH_KEY` (see example doc §5)

Do **not** set `FASTAPI_BASE_URL` in prod `.env` — `docker-compose.prod.yml` sets `http://fastapi:8000` for Spring.

## Deploy on push

```bash
git push   # on your laptop
```

- **Vercel** — auto-deploys frontend
- **GCP** — CI tests, then SSH deploy when backend files change

Update tunnel URLs and Vercel env only when `cloudflared` restarts (new `trycloudflare.com` URLs).

See [`.env.production.example`](.env.production.example).
