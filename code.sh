#!/bin/bash

# Prompt for Supabase credentials
read -p "Enter Supabase Project URL: " SUPABASE_URL
read -p "Enter Supabase Anon Key: " SUPABASE_KEY
read -p "Enter Supabase Service Key: " SUPABASE_SERVICE_KEY
read -p "Enter OpenAI API Key (optional): " OPENAI_API_KEY

# Optional frontend URL
read -p "Enter Frontend URL (default: http://localhost:5173): " FRONTEND_URL
FRONTEND_URL=${FRONTEND_URL:-http://localhost:5173}

# Create .env file
cat > backend/.env << EOL
PORT=3001
NODE_ENV=development

# Supabase Credentials
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_KEY=${SUPABASE_KEY}
SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}

# LLM Providers
OPENAI_API_KEY=${OPENAI_API_KEY}

# Frontend Configuration
FRONTEND_URL=${FRONTEND_URL}
EOL

echo "Environment file created successfully at backend/.env"