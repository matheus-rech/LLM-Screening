# 🎭 Playwright Test Setup - Complete Guide

## ✅ What Has Been Fixed

### 1. **Port Configuration** ✅
- **Problem**: Test expected port 5175, but Vite defaults to 5173
- **Solution**: Configured Playwright to start dev server on port 5175

### 2. **Playwright Configuration** ✅
- **Problem**: Missing `playwright.config.js`
- **Solution**: Created complete configuration with:
  - Auto-starts frontend on port 5175
  - Auto-starts backend on port 3001
  - Configures test directory and patterns
  - Sets up screenshots and videos on failure

### 3. **AI Model Support** ✅
- **Problem**: Test expects Gemini, backend only had OpenAI
- **Solution**: Backend now supports both:
  - Uses Gemini if `GEMINI_API_KEY` is provided
  - Falls back to OpenAI if only `OPENAI_API_KEY` exists

### 4. **Test Scripts** ✅
- **Problem**: No npm scripts for running tests
- **Solution**: Added test commands to package.json:
  - `npm test` - Run tests
  - `npm run test:ui` - Interactive UI mode
  - `npm run test:headed` - See browser while testing
  - `npm run test:debug` - Debug mode

## 🚀 How to Run Tests

### Quick Start (Easiest)
```bash
# Make the script executable (first time only)
chmod +x run-test.sh

# Run the test
./run-test.sh
```

### Manual Method

#### 1. Set Up Environment Variables
Create `backend/.env` file with your API keys:
```env
# Supabase (Required)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key

# Choose ONE of these AI providers:
GEMINI_API_KEY=your_gemini_api_key    # For Google Gemini (test expects this)
# OR
OPENAI_API_KEY=your_openai_api_key    # For OpenAI GPT-4
```

#### 2. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

#### 3. Run Tests
```bash
# Basic test run (headless)
npm test

# See the browser while testing
npm run test:headed

# Interactive UI mode (recommended for debugging)
npm run test:ui

# Debug mode with breakpoints
npm run test:debug
```

## 📊 Test Flow

The test (`demo-ai-screening.spec.js`) performs:

1. **Opens application** at http://localhost:5175
2. **Creates project** with ICH treatment criteria
3. **Imports references** from test-references.txt
4. **Runs AI screening** using Gemini/OpenAI
5. **Views analytics** summary
6. **Takes screenshots** of results

## 🔧 Configuration Files

### `playwright.config.js`
- Configures test environment
- Auto-starts servers
- Sets up browser and test options

### `backend/server.js`
- Supports both Gemini and OpenAI
- CORS configured for test port
- Handles AI screening requests

### `package.json`
- Test scripts added
- Playwright installed as dev dependency

## 🐛 Troubleshooting

### Test fails to start
- Check if ports 5175 and 3001 are free
- Verify backend/.env file exists with API keys

### AI screening not working
- Ensure either GEMINI_API_KEY or OPENAI_API_KEY is set
- Check backend logs: `cd backend && npm start`

### Port already in use
- Kill existing processes:
  ```bash
  # Kill frontend
  lsof -ti:5175 | xargs kill -9
  
  # Kill backend
  lsof -ti:3001 | xargs kill -9
  ```

### Screenshots location
- Success/failure screenshots: `test-results/` folder
- Manual screenshots: `ai-screening-results.png`, `analytics-summary.png`

## 📝 Notes

- **Gemini Preferred**: Test mentions "Gemini" specifically, so use GEMINI_API_KEY if possible
- **Auto-start**: Playwright automatically starts both frontend and backend
- **Parallel Testing**: Disabled for this demo to ensure sequential flow

## 🎉 Success Indicators

When the test succeeds, you'll see:
- ✅ "Demo completed successfully!"
- 📸 Screenshots saved
- 🧠 AI reasoning displayed
- 📊 Analytics summary generated

---

**Ready to test!** Run `./run-test.sh` or `npm test` to start. 🚀
