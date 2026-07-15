# Staging Deployment Guide

## Prerequisites
- Render account (free tier OK)
- Vercel account (free tier OK)
- GitHub access to `anonymous-git162/cenbidding`

---

## Step 1: Create Staging Database (Render)

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **PostgreSQL**
2. Settings:
   - **Name**: `cenbidding-staging-db`
   - **Database**: `cenbidding_staging`
   - **Region**: Oregon (US West)
   - **Plan**: Free
3. Click **Create Database**
4. Once provisioned, copy the **Internal Database URL** (starts with `postgres://`)

---

## Step 2: Create Staging Backend (Render)

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service**
2. Connect GitHub repo: `anonymous-git162/cenbidding`
3. Settings:
   - **Name**: `cenbidding-backend-staging`
   - **Region**: Oregon
   - **Branch**: `master`
   - **Runtime**: Node
   - **Build Command**:
     ```
     cd backend && npm ci && npx prisma generate && npx nest build
     ```
   - **Start Command**:
     ```
     cd backend && npx prisma db push --skip-generate && node dist/src/main.js
     ```
   - **Plan**: Free
4. **Environment Variables** (add these):

| Key | Value |
|-----|-------|
| `DATABASE_URL` | *(paste Internal Database URL from Step 1)* |
| `NODE_ENV` | `staging` |
| `PORT` | `10000` |
| `JWT_SECRET` | `06556ada8830e687031d015633aa7208c30f4d07755ce202121a134c0c18e07f313990c976fc7a0d4275e47d603f51660b59132d303bcd835a2e29bc852fa935` |
| `JWT_EXPIRY` | `15m` |
| `REFRESH_TOKEN_SECRET` | `b5fb0245b31708ddd606b35ee2ac3ea1c1abd477cafc7993e2c7af8cce9e7e4ecc608454902f31fac40a5cb7019ca22eca4856a7d8326161e47e648e4d7a0574` |
| `REFRESH_TOKEN_EXPIRY` | `7d` |
| `FRONTEND_URL` | *(leave blank — set after Step 3)* |
| `AI_PROVIDER` | `groq` |
| `GROQ_API_KEY` | *(copy from production or use new key)* |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |
| `CLOUDINARY_CLOUD_NAME` | `so0cnrzo` |
| `CLOUDINARY_API_KEY` | *(copy from production)* |
| `CLOUDINARY_API_SECRET` | *(copy from production)* |

5. Click **Create Web Service**
6. Wait for first deploy to complete (~5 min)
7. Note the URL: `https://cenbidding-backend-staging.onrender.com`

---

## Step 3: Create Staging Frontend (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com) → **New Project**
2. Import GitHub repo: `anonymous-git162/cenbidding`
3. Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables** (add these):

| Key | Value |
|-----|-------|
| `VITE_WS_URL` | `https://cenbidding-backend-staging.onrender.com` |
| `VITE_API_BASE_URL` | `https://cenbidding-backend-staging.onrender.com/api` |

5. Click **Deploy**
6. Wait for deploy to complete (~2 min)
7. Note the URL: `https://cenbidding-frontend-staging.vercel.app` (or similar)

---

## Step 4: Update Backend CORS

1. Go back to Render → `cenbidding-backend-staging` → **Environment**
2. Set `FRONTEND_URL` = staging frontend URL from Step 3
3. Click **Save** — triggers automatic redeploy

---

## Step 5: Seed Staging Database

1. Go to Render → `cenbidding-backend-staging` → **Shell** tab
2. Run:
   ```bash
   cd backend && node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.\$disconnect(); console.log('Schema pushed via db push on startup');"
   ```
3. Or use the Render Shell to run: `cd backend && node prisma/seed.prod.js` (if seed file exists)

---

## Step 6: Verify Staging

1. Open staging frontend URL in browser
2. Register a new user account
3. Login and verify:
   - [ ] Dashboard loads
   - [ ] Can create procurement
   - [ ] Can submit for approval
   - [ ] Can approve/reject
   - [ ] WebSocket notifications arrive (real IDs, not "bulk")
   - [ ] File upload works
   - [ ] E-bidding round can be opened/closed
   - [ ] Bidding works (no duplicate bids)
   - [ ] Evaluation scoring works
   - [ ] Report page loads

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error | Ensure `FRONTEND_URL` matches exact staging frontend URL (including `https://`) |
| 401 on refresh | Check JWT secrets are set correctly |
| Database connection error | Verify `DATABASE_URL` uses Internal Database URL (not External) |
| Frontend can't reach API | Check `VITE_API_BASE_URL` is set correctly in Vercel |
| WebSocket not connecting | Check `VITE_WS_URL` points to staging backend |

---

## Cleanup

To remove staging environment:
1. Delete Vercel project: `cenbidding-frontend-staging`
2. Delete Render services: `cenbidding-backend-staging` + `cenbidding-staging-db`
