#!/bin/bash
# Script para build e push das imagens Docker para Docker Hub
# Versão: 1.3.1

set -e  # Parar em caso de erro

VERSION="v1.3.1"
DOCKER_USER="edpv"
BACKEND_IMAGE="${DOCKER_USER}/demand-flow-backend"
FRONTEND_IMAGE="${DOCKER_USER}/demand-flow-frontend"

echo "🚀 Iniciando build e push das imagens Docker versão ${VERSION}"
echo ""

# Verificar se está logado no Docker Hub
if ! docker info | grep -q "Username"; then
    echo "⚠️  Você precisa estar logado no Docker Hub"
    echo "Execute: docker login"
    exit 1
fi

# Build Backend
echo "📦 Building backend..."
docker build -t ${BACKEND_IMAGE}:latest -t ${BACKEND_IMAGE}:${VERSION} ./backend
if [ $? -eq 0 ]; then
    echo "✅ Backend build concluído"
else
    echo "❌ Erro ao fazer build do backend"
    exit 1
fi

# Build Frontend
echo "📦 Building frontend..."
docker build -t ${FRONTEND_IMAGE}:latest -t ${FRONTEND_IMAGE}:${VERSION} ./frontend
if [ $? -eq 0 ]; then
    echo "✅ Frontend build concluído"
else
    echo "❌ Erro ao fazer build do frontend"
    exit 1
fi

# Push Backend
echo "📤 Pushing backend..."
docker push ${BACKEND_IMAGE}:latest
docker push ${BACKEND_IMAGE}:${VERSION}
if [ $? -eq 0 ]; then
    echo "✅ Backend push concluído"
else
    echo "❌ Erro ao fazer push do backend"
    exit 1
fi

# Push Frontend
echo "📤 Pushing frontend..."
docker push ${FRONTEND_IMAGE}:latest
docker push ${FRONTEND_IMAGE}:${VERSION}
if [ $? -eq 0 ]; then
    echo "✅ Frontend push concluído"
else
    echo "❌ Erro ao fazer push do frontend"
    exit 1
fi

echo ""
echo "🎉 Build e push concluídos com sucesso!"
echo ""
echo "Imagens publicadas:"
echo "  - ${BACKEND_IMAGE}:latest"
echo "  - ${BACKEND_IMAGE}:${VERSION}"
echo "  - ${FRONTEND_IMAGE}:latest"
echo "  - ${FRONTEND_IMAGE}:${VERSION}"
echo ""

