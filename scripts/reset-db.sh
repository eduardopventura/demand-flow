#!/bin/bash

# Reset database to initial state

echo "🔄 Resetting database to initial state..."
echo ""

cd backend && npm run seed

echo ""
echo "✅ Database reset complete!"
echo ""
echo "If running in Docker, restart the backend:"
echo "  docker-compose restart backend"

