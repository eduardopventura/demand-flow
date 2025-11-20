#!/bin/bash

# Stop script for Demand Flow

echo "🛑 Stopping Demand Flow..."
docker-compose down

echo ""
echo "✅ All services stopped"
echo ""
echo "To remove volumes (clear database):"
echo "  docker-compose down -v"

