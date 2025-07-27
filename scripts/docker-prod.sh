#!/bin/bash

# AIProxy Production Docker Deployment Script

set -e

echo "🛡️  AIProxy Production Deployment"
echo "================================="

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one based on .env.example"
    exit 1
fi

# Validate required environment variables
source .env

REQUIRED_VARS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "OPENAI_API_KEY"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '   - %s\n' "${MISSING_VARS[@]}"
    echo "Please set these in your .env file"
    exit 1
fi

echo "✅ Environment variables validated"

# Build and start services
echo "🏗️  Building and starting services..."

# Create network
docker network create aiproxy-network 2>/dev/null || true

# Start database first
echo "🐘 Starting PostgreSQL..."
docker-compose -f docker/docker-compose.yml up -d postgres

# Wait for database
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

echo "✅ PostgreSQL is ready"

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose -f docker/docker-compose.yml run --rm backend npx prisma generate
docker-compose -f docker/docker-compose.yml run --rm backend npx prisma db push

# Start Presidio services
echo "🔒 Starting Presidio services..."
docker-compose -f docker/docker-compose.presidio.yml up -d

# Start main services
echo "🚀 Starting AIProxy services..."
docker-compose -f docker/docker-compose.yml up -d backend proxy frontend

echo "⏳ Waiting for services to be ready..."

# Wait for backend
for i in {1..60}; do
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        echo "✅ Backend is ready"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "❌ Backend failed to start"
        docker-compose -f docker/docker-compose.yml logs backend
        exit 1
    fi
    sleep 1
done

# Wait for proxy
for i in {1..60}; do
    if curl -s http://localhost:3000/health >/dev/null 2>&1; then
        echo "✅ Proxy is ready"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "❌ Proxy failed to start"
        docker-compose -f docker/docker-compose.yml logs proxy
        exit 1
    fi
    sleep 1
done

# Wait for frontend
for i in {1..60}; do
    if curl -s http://localhost/ >/dev/null 2>&1; then
        echo "✅ Frontend is ready"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "❌ Frontend failed to start"
        docker-compose -f docker/docker-compose.yml logs frontend
        exit 1
    fi
    sleep 1
done

echo ""
echo "🎉 AIProxy is now running in production mode!"
echo ""
echo "Services:"
echo "- Frontend: http://localhost/"
echo "- Backend API: http://localhost:3001"
echo "- Proxy Service: http://localhost:3000"
echo "- PostgreSQL: localhost:5432"
echo "- Presidio Analyzer: http://localhost:5001"
echo "- Presidio Anonymizer: http://localhost:5002"
echo ""
echo "To view logs: docker-compose -f docker/docker-compose.yml logs -f"
echo "To stop: docker-compose -f docker/docker-compose.yml down"
echo ""
echo "⚠️  Remember to:"
echo "1. Configure a reverse proxy (nginx, traefik) for production"
echo "2. Set up SSL certificates"
echo "3. Configure monitoring and backups"
echo "4. Review security settings"