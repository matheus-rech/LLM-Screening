#!/bin/bash

# Script to run Playwright tests with proper setup
echo "🚀 Starting Playwright Test Runner for AI Screening Demo"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Check if backend node_modules exists
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check if .env file exists in backend
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Warning: backend/.env file not found"
    echo "Please create backend/.env with your API keys:"
    echo "  SUPABASE_URL=your_supabase_url"
    echo "  SUPABASE_KEY=your_supabase_key"
    echo "  GEMINI_API_KEY=your_gemini_api_key (or OPENAI_API_KEY)"
    exit 1
fi

echo ""
echo "✅ Dependencies checked"
echo ""
echo "🎭 Running Playwright tests..."
echo "This will automatically start:"
echo "  - Frontend on http://localhost:5175"
echo "  - Backend on http://localhost:3001"
echo ""

# Run the test
npm test

echo ""
echo "✨ Test complete! Check the results above."
echo ""
echo "💡 Tips:"
echo "  - Run 'npm run test:ui' for interactive UI mode"
echo "  - Run 'npm run test:headed' to see the browser"
echo "  - Screenshots saved in test-results/ folder"
