# How to Run VedaAI

## Step 1 — Fill in your credentials

### Backend → open `backend/.env` and replace:
- `your_mongodb_uri_here` → your MongoDB Atlas URI (e.g. mongodb+srv://user:pass@cluster.mongodb.net/vedaai)
- `your_redis_url_here` → your Upstash Redis URL (e.g. rediss://user:pass@endpoint.upstash.io:6379)
- `your_anthropic_api_key_here` → your Anthropic API key (e.g. sk-ant-api03-...)

## Step 2 — Install Node.js
Download from: https://nodejs.org/en/download (choose v20 LTS)

## Step 3 — Run Backend
Open a terminal in the `backend` folder:
```
npm install
npm run dev
```

## Step 4 — Run Frontend
Open another terminal in the `frontend` folder:
```
npm install
npm run dev
```

## Step 5 — Open the app
Go to: http://localhost:3000

---

## Free services to use:
- MongoDB Atlas (free): https://cloud.mongodb.com
- Upstash Redis (free): https://upstash.com
- Anthropic API key: https://console.anthropic.com
