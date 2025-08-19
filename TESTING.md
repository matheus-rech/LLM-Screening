# 🧪 Testing Guide - LLM Screening App

## 📋 Pre-Testing Checklist

### ✅ Prerequisites
- [ ] Node.js 18+ installed
- [ ] Python 3.8+ installed
- [ ] API keys configured (Gemini, OpenAI)
- [ ] Supabase project set up

### 🔧 Setup
```bash
# 1. Install dependencies
./scripts/setup-project.sh

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your API keys
```

## 🧪 Backend Testing

### 1. Flask Backend Health Check
```bash
cd backend
source venv/bin/activate
python app.py
```

**Expected Output:**
```
 * Running on http://0.0.0.0:3001
 * Debug mode: off
```

### 2. API Endpoint Tests
```bash
# Health check
curl http://localhost:3001/

# LLM invocation test
curl -X POST http://localhost:3001/api/llm/invoke \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello, respond with JSON {\"message\":\"test\"}",
    "response_json_schema": {
      "type": "object",
      "properties": {"message": {"type": "string"}},
      "required": ["message"]
    },
    "provider": "google"
  }'
```

### 3. Automated Backend Tests
```bash
python test_backend.py
```

## 🧪 Frontend Testing

### 1. Start Frontend
```bash
npm run dev
```

### 2. Manual Testing Checklist
- [ ] **Homepage loads** - http://localhost:5173
- [ ] **Import page** - Upload test references
- [ ] **Screening page** - Test AI screening
- [ ] **Dual Review** - Test dual AI reviewers
- [ ] **Analytics** - View screening statistics

### 3. AI Screening Test
1. Go to **Import** page
2. Upload test references (use `test-references.txt`)
3. Go to **Screening** page
4. Start AI screening
5. Verify dual AI reviewers work (Gemini + OpenAI)

## 🧪 Integration Testing

### 1. End-to-End Flow
```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate && python app.py

# Terminal 2: Frontend
npm run dev

# Terminal 3: Test
python test_backend.py
```

### 2. Dual LLM Test
1. Create a test reference
2. Run dual AI screening
3. Verify both reviewers respond
4. Check conflict resolution

## 🐛 Common Issues & Solutions

### Backend Issues
- **Port 3001 in use**: `lsof -ti:3001 | xargs kill -9`
- **Import errors**: `pip install -r requirements.txt --force-reinstall`
- **API key errors**: Check `.env` file

### Frontend Issues
- **CORS errors**: Ensure backend is running on port 3001
- **API errors**: Check `VITE_BACKEND_URL` in `.env`
- **Build errors**: `npm install` and restart

### Supabase Issues
- **Connection errors**: Verify `SUPABASE_URL` and `SUPABASE_KEY`
- **Schema errors**: Run `backend/database/schema.sql` in Supabase

## 📊 Test Data

### Sample References
Use `test-references.txt` for testing:
```
Title: Test Study 1
Abstract: This is a test abstract for systematic review screening.
Authors: Test Author
Year: 2024
Journal: Test Journal

Title: Test Study 2
Abstract: Another test abstract with different content.
Authors: Another Author
Year: 2023
Journal: Another Journal
```

### Expected Results
- **AI Reviewer 1** (Gemini): Should provide recommendation
- **AI Reviewer 2** (OpenAI): Should provide recommendation
- **Agreement/Conflict**: Based on reviewer decisions
- **Final Status**: Determined by agreement logic

## 🎯 Success Criteria

### ✅ Backend Tests Pass
- Health endpoint responds
- LLM endpoint works with both providers
- Database operations succeed

### ✅ Frontend Tests Pass
- All pages load correctly
- AI screening works
- Dual review system functions
- Analytics display data

### ✅ Integration Tests Pass
- Frontend connects to backend
- Dual LLM screening completes
- Data persists in Supabase

## 🚀 Ready for Deployment

Once all tests pass:
1. **Backend**: Deploy to Railway/Render
2. **Frontend**: Deploy to Vercel
3. **Database**: Supabase is already cloud-hosted
4. **Environment**: Update production URLs

## 📝 Test Report Template

```
Test Date: ___________
Tester: ___________

Backend Tests:
□ Health endpoint
□ LLM endpoint (Google)
□ LLM endpoint (OpenAI)
□ Database operations

Frontend Tests:
□ Homepage
□ Import functionality
□ AI screening
□ Dual review
□ Analytics

Integration Tests:
□ End-to-end flow
□ Dual LLM screening
□ Data persistence

Issues Found:
□ None
□ [List issues]

Ready for Deployment: □ Yes □ No
```
