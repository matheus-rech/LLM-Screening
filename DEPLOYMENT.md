# 🚀 Deployment Guide - LLM Screening App

## 📋 Overview
This app uses a **dual deployment strategy**:
- **Frontend (React/Vite)** → Vercel
- **Backend (Flask)** → Railway/Render

## 🎯 Quick Deploy

### 0. Supabase Setup (5 minutes)
```bash
# Install Supabase CLI
npm install -g supabase

# Set up your Supabase project
./scripts/setup-supabase.sh

# Or manually:
# 1. Go to https://supabase.com
# 2. Create new project
# 3. Run the SQL from backend/database/schema.sql
# 4. Get your API keys
```

### 1. Frontend (Vercel) - 2 minutes
```bash
# Deploy to Vercel
npx vercel --prod
```

**Environment Variables for Vercel:**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_USE_CUSTOM_BACKEND=true
VITE_BACKEND_URL=https://your-flask-backend.railway.app
```

### 2. Backend (Railway) - 3 minutes
```bash
# Deploy to Railway
railway login
railway init
railway up
```

**Environment Variables for Railway:**
```
GEMINI_API_KEY=AIzaSyD_N7EWlKL6AlsetfXG4mo67iC-AeRc1o0
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
FRONTEND_URL=https://your-vercel-app.vercel.app
```

**Required Node.js version:** 18+ (for Supabase CLI)

## 🔧 Alternative Backend Platforms

### Render
- Connect GitHub repo
- Set environment variables
- Deploy automatically

### Heroku
```bash
heroku create your-app-name
git push heroku main
```

## 🌐 Production URLs

After deployment, update your frontend environment:
```
VITE_BACKEND_URL=https://your-backend-url.railway.app
```

## ✅ Verification

1. **Backend Health Check:**
```bash
curl https://your-backend-url.railway.app/
# Should return: {"hello": "world"}
```

2. **LLM Test:**
```bash
curl -X POST https://your-backend-url.railway.app/api/llm/invoke \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello","provider":"google"}'
```

3. **Frontend Test:**
- Visit your Vercel URL
- Try the AI screening feature

## 🔄 Updates

**Frontend Updates:**
```bash
git push origin main
# Vercel auto-deploys
```

**Backend Updates:**
```bash
git push origin main
# Railway auto-deploys
```

## 🛠️ Local Development

```bash
# Frontend
npm run dev

# Backend
cd backend
source venv/bin/activate
python app.py
```

## 📊 Features

✅ **Dual LLM Screening** (Gemini + OpenAI)  
✅ **Supabase Database**  
✅ **React Frontend**  
✅ **Flask Backend**  
✅ **Production Ready**  

## 🆘 Troubleshooting

**CORS Issues:** Check `FRONTEND_URL` in backend env vars  
**LLM Errors:** Verify API keys are set correctly  
**Database Issues:** Check Supabase connection  

## 🎉 Success!

Your app is now deployed with:
- **Frontend:** https://your-app.vercel.app
- **Backend:** https://your-backend.railway.app
- **Database:** Supabase (cloud)
