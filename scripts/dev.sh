#!/bin/bash

# AIProxy Development Server Script
# Starts all services in development mode

set -e

echo "🛡️  Starting AIProxy Development Environment"
echo "============================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please run ./scripts/setup.sh first."
    exit 1
fi

# Check if PostgreSQL is running
if ! docker-compose -f docker/docker-compose.yml exec -T postgres pg_isready -U aiproxy &>/dev/null; then
    echo "🐘 Starting PostgreSQL..."
    docker-compose -f docker/docker-compose.yml up -d postgres
    
    echo "⏳ Waiting for PostgreSQL..."
    for i in {1..30}; do
        if docker-compose -f docker/docker-compose.yml exec -T postgres pg_isready -U aiproxy &>/dev/null; then
            break
        fi
        if [ $i -eq 30 ]; then
            echo "❌ PostgreSQL failed to start"
            exit 1
        fi
        sleep 1
    done
fi

echo "✅ PostgreSQL is ready"

# Check if Presidio services are running (optional)
if curl -s http://localhost:5001/health >/dev/null 2>&1 && curl -s http://localhost:5002/health >/dev/null 2>&1; then
    echo "✅ Presidio services are running"
else
    echo "⚠️  Presidio services are not running. PII detection will use regex fallback."
    echo "   To start Presidio: docker-compose -f docker/docker-compose.presidio.yml up -d"
fi

# Generate Prisma client
echo "🔨 Generating Prisma client..."
cd packages/backend
npx prisma generate
cd ../..

echo ""
echo "🚀 Starting development servers..."
echo ""
echo "Services will be available at:"
echo "- Frontend: http://localhost:5173"
echo "- Backend API: http://localhost:3001"
echo "- Proxy Service: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start all services
npm run dev