# Deploying VedaAI (Vercel + backend)

The **frontend on Vercel cannot work alone**. Assignment creation calls the **Express API** (MongoDB, Redis, Groq). You must deploy the `backend` folder too (Railway, Render, Fly.io, etc.).

## 1. Deploy the backend (separate project from frontend)

**Recommended:** [Railway](https://railway.app) or [Render](https://render.com) for the backend (WebSockets + BullMQ worker).

**Vercel backend:** Supported via `backend/api/index.ts` (serverless). After deploy, `/health` must return JSON. WebSockets do **not** work on Vercel — the frontend polls for status. AI generation runs inline with `waitUntil` (max ~60s on Pro, shorter on Hobby).

**Your frontend URL (for CORS):** `https://vedaai-assignmentgenerator.vercel.app`

### Railway / Render — Build & run

| Setting | Value |
|---------|--------|
| **Root directory** | `backend` |
| **Install command** | `npm install` |
| **Build command** | `npm run build` |
| **Start command** | `npm start` |
| **Port** | `4000` (or set `PORT` env — hosts usually inject this automatically) |

### Vercel — Build & Output (second project, if you still use Vercel)

| Setting | Value | Override? |
|---------|--------|-----------|
| **Root Directory** | `backend` | — |
| **Framework Preset** | Other | — |
| **Install Command** | `npm install` | **On** |
| **Build Command** | `npm run build` | **On** |
| **Output Directory** | *(leave empty / N/A)* | **Off** |
| **Development Command** | `npm run dev` | optional |

Do **not** leave Install/Build as `None` — nothing will compile and the API will not run.

**If you see:** `Invalid export found in module backend/src/index.js` — redeploy with the latest repo code. The backend entry is `api/index.ts`, not `src/index.ts`.

### Backend environment variables

| Variable | Example |
|----------|---------|
| `MONGODB_URI` | `mongodb+srv://...` |
| `REDIS_URL` | `rediss://...` (Upstash / Railway Redis) |
| `GROQ_API_KEY` | your Groq key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |
| `FRONTEND_URL` | `https://vedaai-assignmentgenerator.vercel.app` |
| `NODE_ENV` | `production` |

After deploy, copy the public backend URL (e.g. `https://vedaai-api.up.railway.app`) — you will use it as `API_URL` on the **frontend** Vercel project.

## 2. Deploy the frontend on Vercel

**Root Directory:** `frontend`

**Environment variables** (Project → Settings → Environment Variables):

| Variable | Example | Required |
|----------|---------|----------|
| `API_URL` | `https://vedaai-api.railway.app` | **Yes** — backend root URL only (no `/api` suffix). Proxies `/api/*` via Next.js. |
| `NEXT_PUBLIC_WS_URL` | `https://vedaai-api.railway.app` | **Yes** — WebSocket / real-time progress |

**Common 404 fix:** `API_URL` must be your **backend** host (Railway/Render), **not** your Vercel app URL.  
Remove `NEXT_PUBLIC_API_URL` if it points at Vercel or `localhost` — the browser should call `/api/...` on your own domain.

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
