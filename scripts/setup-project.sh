#!/bin/bash

# LLM Screening App - Complete Setup Script
echo "🚀 Setting up LLM Screening App..."

# Check Node.js version
echo "📋 Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first:"
    echo "   https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check Python version
echo "📋 Checking Python version..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8+ first:"
    exit 1
fi

echo "✅ Python $(python3 --version) detected"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install Supabase CLI
echo "📦 Installing Supabase CLI..."
npm install -g supabase

# Set up backend
echo "🐍 Setting up Python backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
echo "📦 Installing Python dependencies..."
source venv/bin/activate
pip install -r requirements.txt

cd ..

# Set up Supabase
echo "🗄️  Setting up Supabase..."
if [ -f "scripts/setup-supabase.sh" ]; then
    chmod +x scripts/setup-supabase.sh
    echo "📋 Running Supabase setup..."
    ./scripts/setup-supabase.sh
else
    echo "⚠️  Supabase setup script not found. Please run manually:"
    echo "   1. Go to https://supabase.com"
    echo "   2. Create new project"
    echo "   3. Run SQL from backend/database/schema.sql"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Update .env files with your API keys"
echo "   2. Deploy backend: cd backend && python app.py"
echo "   3. Deploy frontend: npm run dev"
echo "   4. Follow DEPLOYMENT.md for production deployment"
echo ""
echo "🔑 Required environment variables:"
echo "   - GEMINI_API_KEY"
echo "   - OPENAI_API_KEY"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_KEY"
