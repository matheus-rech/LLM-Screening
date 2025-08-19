#!/bin/bash

# Supabase Setup Script for LLM Screening App
echo "🚀 Setting up Supabase database..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Initialize Supabase project
echo "📋 Initializing Supabase project..."
supabase init

# Start Supabase locally (optional)
echo "🏠 Starting Supabase locally..."
supabase start

# Apply database schema
echo "🗄️  Applying database schema..."
supabase db reset

echo "✅ Supabase setup complete!"
echo ""
echo "📊 Your Supabase project is ready with:"
echo "   - Database schema applied"
echo "   - Row Level Security enabled"
echo "   - API endpoints configured"
echo ""
echo "🔑 Get your credentials from:"
echo "   https://supabase.com/dashboard/project/[YOUR-PROJECT-ID]/settings/api"
echo ""
echo "🌐 Update your .env files with:"
echo "   SUPABASE_URL=your_project_url"
echo "   SUPABASE_KEY=your_anon_key"
