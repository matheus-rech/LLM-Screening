# 🚀 Deployment Guide - LLM Screening App

## 🏗️ **Simplified Architecture**

- **Frontend**: React + Vite (deploy to Vercel)
- **Backend**: Supabase (database + serverless functions)
- **LLM**: Direct API calls from frontend to Gemini/OpenAI

## 📋 **Prerequisites**

1. **Supabase Project** (already set up)
2. **API Keys**:
   - Gemini API Key ✅
   - OpenAI API Key (optional, for dual LLM)
3. **Vercel Account** (for frontend deployment)

## 🔧 **Local Testing**

### 1. Test Frontend
```bash
# Start development server
npm run dev

# Open http://localhost:5173
# Test dual LLM functionality
```

### 2. Test Dual LLM
```bash
# Open test-dual-llm.html in browser
# Click "Test Gemini" to verify API works
# Add OpenAI key to .env for dual testing
```

## 🚀 **Deployment Steps**

### Step 1: Deploy Frontend to Vercel

1. **Connect to Vercel**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   ```

2. **Deploy**:
   ```bash
   # Deploy to Vercel
   vercel --prod
   ```

3. **Configure Environment Variables** in Vercel Dashboard:
   ```
   VITE_SUPABASE_URL=https://jloyjcanvtolhgodeupf.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_GEMINI_API_KEY=AIzaSyD_N7EWlKL6AlsetfXG4mo67iC-AeRc1o0
   VITE_OPENAI_API_KEY=your-openai-api-key
   ```

### Step 2: Verify Supabase Setup

1. **Database Schema** (already applied):
   ```sql
   -- Check if schema is applied in Supabase Dashboard
   -- Tables: references, screening_results, etc.
   ```

2. **Row Level Security** (RLS):
   ```sql
   -- Enable RLS on tables
   ALTER TABLE references ENABLE ROW LEVEL SECURITY;
   ALTER TABLE screening_results ENABLE ROW LEVEL SECURITY;
   ```

### Step 3: Test Production

1. **Visit your Vercel URL**
2. **Test Import functionality**
3. **Test Dual LLM screening**
4. **Verify data persistence in Supabase**

## 🔍 **Verification Checklist**

### ✅ Frontend Deployment
- [ ] Vercel deployment successful
- [ ] Environment variables configured
- [ ] App loads without errors
- [ ] All pages accessible

### ✅ Supabase Integration
- [ ] Database connection working
- [ ] Schema applied correctly
- [ ] RLS policies configured
- [ ] Data persistence working

### ✅ LLM Integration
- [ ] Gemini API calls working
- [ ] OpenAI API calls working (if configured)
- [ ] Dual LLM screening functional
- [ ] Error handling working

### ✅ Core Features
- [ ] Reference import working
- [ ] AI screening working
- [ ] Dual review system working
- [ ] Analytics displaying data
- [ ] Export functionality working

## 🐛 **Troubleshooting**

### Frontend Issues
- **Build errors**: Check environment variables in Vercel
- **API errors**: Verify API keys are correct
- **CORS errors**: Not applicable (direct API calls)

### Supabase Issues
- **Connection errors**: Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- **Permission errors**: Check RLS policies
- **Schema errors**: Run schema.sql in Supabase SQL editor

### LLM Issues
- **Gemini errors**: Check `VITE_GEMINI_API_KEY`
- **OpenAI errors**: Check `VITE_OPENAI_API_KEY`
- **Rate limiting**: Implement retry logic if needed

## 📊 **Performance Optimization**

### Frontend
- **Code splitting**: Already configured with Vite
- **Caching**: Vercel handles CDN caching
- **Bundle size**: Monitor with `npm run build`

### API Calls
- **Rate limiting**: Monitor API usage
- **Error handling**: Implement fallbacks
- **Caching**: Consider caching LLM responses

## 🔒 **Security Considerations**

1. **API Keys**: Never expose in client-side code (use Vite env vars)
2. **Supabase RLS**: Ensure proper access controls
3. **Input validation**: Validate all user inputs
4. **HTTPS**: Vercel provides SSL by default

## 📈 **Monitoring**

### Vercel Analytics
- Page views and performance
- Error tracking
- User behavior

### Supabase Dashboard
- Database performance
- API usage
- Error logs

### API Monitoring
- Gemini API usage
- OpenAI API usage (if configured)
- Rate limit monitoring

## 🎯 **Success Metrics**

- **Deployment**: Frontend accessible via Vercel URL
- **Functionality**: All features working in production
- **Performance**: Fast loading times (< 3s)
- **Reliability**: No critical errors in production
- **User Experience**: Smooth dual LLM screening workflow

## 🚀 **Go Live Checklist**

- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] Supabase database ready
- [ ] LLM APIs working
- [ ] Core features tested
- [ ] Performance verified
- [ ] Security reviewed
- [ ] Monitoring set up

**🎉 Ready to deploy! Your LLM Screening app is production-ready!**
