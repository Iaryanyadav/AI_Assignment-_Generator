# Deploying VedaAI (Vercel + backend)

The **frontend on Vercel cannot work alone**. Assignment creation calls the **Express API** (MongoDB, Redis, Groq). You must deploy the `backend` folder too (Railway, Render, Fly.io, etc.).

## 1. Deploy the backend

1. Create a project from the `backend` directory.
2. Set environment variables (see `backend/.env.example`):
   - `MONGODB_URI`
   - `REDIS_URL`
   - `GROQ_API_KEY`
   - `FRONTEND_URL` = your Vercel URL, e.g. `https://your-app.vercel.app`
3. Note the public URL, e.g. `https://vedaai-api.railway.app`.

## 2. Deploy the frontend on Vercel

**Root Directory:** `frontend`

**Environment variables** (Project → Settings → Environment Variables):

| Variable | Example | Required |
|----------|---------|----------|
| `API_URL` | `https://vedaai-api.railway.app` | Yes — proxies `/api/*` to your backend (no CORS issues) |
| `NEXT_PUBLIC_WS_URL` | `https://vedaai-api.railway.app` | Yes — WebSocket / real-time progress |

Do **not** leave `NEXT_PUBLIC_API_URL` pointing at `http://localhost:4000` on Vercel.

Redeploy after saving env vars.

## 3. Verify

1. Open `https://your-backend-url/health` — should return `{"status":"ok",...}`.
2. Open your Vercel app → create assignment → upload file → Next.
3. If it still fails, open browser DevTools → Network and check whether `/api/assignments` returns an error.

## Local development

```bash
# Terminal 1 — backend
cd backend && npm install && npm run dev

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

Default rewrites send `http://localhost:3000/api/*` → `http://localhost:4000/api/*`.
