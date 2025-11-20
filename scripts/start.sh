#!/bin/bash

# Start script for Demand Flow
# Usage: 
#   ./scripts/start.sh        - Start production (default)
#   ./scripts/start.sh dev    - Start dev environment (parallel, different ports)

MODE=${1:-prod}

echo "╔═══════════════════════════════════════════════════╗"
echo "║                                                   ║"
echo "║         🚀 Starting Demand Flow                   ║"
echo "║                                                   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

if [ "$MODE" = "prod" ]; then
    echo "📦 Mode: Production"
    echo "🌐 Network: demand-flow-network"
    echo ""
    docker-compose up -d --build
    echo ""
    echo "✅ Services started!"
    echo ""
    echo "🌐 Access (substitua pelo seu IP):"
    echo "  Frontend: http://192.168.1.4:3060"
    echo "  Backend:  http://192.168.1.4:3000"
    echo "  Health:   http://192.168.1.4:3000/health"
    echo ""
    echo "📊 View logs:"
    echo "  docker-compose logs -f"
    echo ""
    echo "⏹️  Stop:"
    echo "  docker-compose down"
elif [ "$MODE" = "dev" ]; then
    echo "📦 Mode: Development (Parallel Environment)"
    echo "🌐 Network: demand-flow-dev-network"
    echo "⚠️  Roda EM PARALELO com produção (portas diferentes)"
    echo ""
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
    echo ""
    echo "✅ Dev environment started!"
    echo ""
    echo "🌐 Access (substitua pelo seu IP):"
    echo "  Frontend DEV: http://192.168.1.4:3061  (prod: :3060)"
    echo "  Backend DEV:  http://192.168.1.4:3001  (prod: :3000)"
    echo "  Database DEV: backend/db-dev.json      (prod: db.json)"
    echo ""
    echo "📊 View logs:"
    echo "  docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f"
    echo ""
    echo "⏹️  Stop dev only:"
    echo "  docker-compose -f docker-compose.yml -f docker-compose.dev.yml down"
else
    echo "❌ Invalid mode: $MODE"
    echo ""
    echo "Usage:"
    echo "  ./scripts/start.sh        - Start production (default)"
    echo "  ./scripts/start.sh prod   - Start production"
    echo "  ./scripts/start.sh dev    - Start dev (parallel)"
    exit 1
fi

