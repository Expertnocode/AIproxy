#!/bin/bash

# AIProxy Setup Script
# This script sets up the development environment for AIProxy

set -e

echo "🛡️  AIProxy Development Setup"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
if [ "$NODE_MAJOR" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is not supported. Please install Node.js 18 or later."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Check if Docker is installed and running
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker to run PostgreSQL and Presidio services."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker."
    exit 1
fi

echo "✅ Docker is available and running"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file first
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys and configuration"
else
    echo "✅ .env file already exists"
fi

# Build shared package
echo "🔨 Building shared package..."
(cd packages/shared && npm run build)

# Start PostgreSQL
echo "🐘 Starting PostgreSQL..."
docker network create aiproxy-network 2>/dev/null || true
docker-compose -f docker/docker-compose.yml up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker-compose -f docker/docker-compose.yml exec -T postgres pg_isready -U aiproxy &>/dev/null; then
        echo "✅ PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ PostgreSQL failed to start after 30 seconds"
        exit 1
    fi
    sleep 1
done

# Run database migrations
echo "🗄️  Running database migrations..."
cd packages/backend

# Copy .env file to backend directory for Prisma
cp ../../.env .

npx prisma generate
npx prisma db push
cd ../..

# Start Presidio services (optional)
read -p "🔒 Start Presidio PII detection services? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting Presidio services..."
    docker-compose -f docker/docker-compose.presidio.yml up -d
    
    echo "⏳ Waiting for Presidio services to be ready..."
    for i in {1..60}; do
        if curl -s http://localhost:5001/health >/dev/null 2>&1 && curl -s http://localhost:5002/health >/dev/null 2>&1; then
            echo "✅ Presidio services are ready"
            break
        fi
        if [ $i -eq 60 ]; then
            echo "⚠️  Presidio services took longer than expected to start"
            echo "   PII detection will fall back to regex patterns"
            break
        fi
        sleep 1
    done
else
    echo "⚠️  Presidio services not started. PII detection will use regex fallback."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys:"
echo "   - OPENAI_API_KEY=sk-..."
echo "   - CLAUDE_API_KEY=..."
echo "   - GEMINI_API_KEY=..."
echo ""
echo "2. Start the development servers:"
echo "   npm run dev"
echo ""
echo "3. Access the application:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend API: http://localhost:3001"
echo "   - Proxy Service: http://localhost:3000"
echo ""
echo "4. Create your first user by visiting the frontend and clicking 'Sign up'"
echo ""
echo "For more information, see the README.md file."