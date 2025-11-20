# 🐳 Docker Guide - Demand Flow

## 📋 Guia Completo de Uso com Docker

---

## 🚀 Quick Start

### Primeira Vez (Setup Inicial)

```bash
# 1. Clonar o repositório
git clone <seu-repo>
cd demand-flow

# 2. Copiar variáveis de ambiente
cp .env.example .env

# 3. Subir os serviços
docker-compose up -d

# 4. Verificar status
docker-compose ps

# 5. Ver logs
docker-compose logs -f
```

**Pronto!** Acesse:
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

---

## 📦 Comandos Essenciais

### Gerenciamento de Serviços

```bash
# Subir tudo
docker-compose up -d

# Subir com rebuild (após mudanças)
docker-compose up -d --build

# Parar tudo
docker-compose down

# Parar e remover volumes (limpa database!)
docker-compose down -v

# Reiniciar serviço específico
docker-compose restart backend
docker-compose restart frontend

# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Desenvolvimento vs Produção

```bash
# Desenvolvimento (com hot reload)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Produção (otimizado)
docker-compose up -d --build

# Ou use os scripts:
./scripts/start.sh dev
./scripts/start.sh prod
./scripts/stop.sh
```

---

## 🔧 Estrutura Docker

### Serviços

```
demand-flow/
├── backend/           # JSON-Server API
│   ├── Dockerfile
│   ├── server.js
│   └── db.json       # Database (persistente)
│
├── frontend/          # React App
│   ├── Dockerfile    # Produção (Nginx)
│   └── Dockerfile.dev # Desenvolvimento
│
├── docker-compose.yml      # Configuração principal
└── docker-compose.dev.yml  # Override para dev
```

### Volumes

```yaml
volumes:
  - ./backend/db.json:/app/db.json  # Database persistente
  - backend-data:/app/data          # Dados do backend
```

**Importante:** O arquivo `backend/db.json` é persistente e fica na sua máquina!

---

## 🛠️ Comandos Úteis

### Executar Comandos nos Containers

```bash
# Shell no backend
docker-compose exec backend sh

# Shell no frontend
docker-compose exec frontend sh

# Executar comando específico
docker-compose exec backend npm run seed
docker-compose exec backend node -v
```

### Resetar Database

```bash
# Opção 1: Usar script de seed
docker-compose exec backend npm run seed

# Opção 2: Usar script local
./scripts/reset-db.sh

# Opção 3: Manual
cd backend && npm run seed
docker-compose restart backend
```

### Ver Logs Específicos

```bash
# Últimas 100 linhas
docker-compose logs --tail=100

# Seguir logs em tempo real
docker-compose logs -f backend

# Logs desde um horário
docker-compose logs --since 2024-01-01T00:00:00
```

### Inspecionar Containers

```bash
# Informações do container
docker inspect demand-flow-backend

# Estatísticas de uso
docker stats demand-flow-backend demand-flow-frontend

# Processos rodando
docker-compose top
```

---

## 🐛 Troubleshooting

### Problema: Porta já em uso

```bash
# Erro: Bind for 0.0.0.0:3000 failed: port is already allocated

# Solução 1: Encontrar processo
lsof -i :3000
kill -9 <PID>

# Solução 2: Mudar porta no docker-compose.yml
ports:
  - "3001:3000"  # Usar 3001 ao invés de 3000
```

### Problema: Container não inicia

```bash
# Ver logs detalhados
docker-compose logs backend

# Forçar rebuild
docker-compose up --build --force-recreate backend

# Limpar tudo e recomeçar
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

### Problema: Database vazio

```bash
# Verificar se db.json existe
ls -la backend/db.json

# Recriar com seed
docker-compose exec backend npm run seed

# Ou parar e recriar volume
docker-compose down
docker-compose up -d
```

### Problema: Frontend não conecta ao backend

```bash
# Verificar variável de ambiente
docker-compose exec frontend env | grep VITE_API_URL

# Deve mostrar: VITE_API_URL=http://backend:3000/api

# Se não, editar .env e rebuildar:
docker-compose up -d --build frontend
```

### Problema: Mudanças não aparecem

```bash
# Rebuild completo
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Ou para serviço específico
docker-compose build --no-cache backend
docker-compose up -d backend
```

---

## 📊 Monitoramento

### Health Checks

```bash
# Backend
curl http://localhost:3000/health

# Resposta esperada:
# {"status":"healthy","timestamp":"...","version":"1.0.0","database":"json-server"}

# Frontend (se nginx.conf tem /health)
curl http://localhost:8080/health
```

### Ver Recursos Usados

```bash
# CPU e Memória
docker stats demand-flow-backend demand-flow-frontend

# Espaço em disco
docker system df

# Limpar espaço
docker system prune -a --volumes
```

---

## 🔐 Variáveis de Ambiente

### Arquivo .env

```bash
# Backend
PORT=3000
NODE_ENV=production

# Frontend
VITE_API_URL=http://localhost:3000/api

# Docker
COMPOSE_PROJECT_NAME=demand-flow
```

### Usar em Diferentes Ambientes

```bash
# Desenvolvimento
cp .env.example .env.dev

# Produção
cp .env.example .env.prod

# Usar específico
docker-compose --env-file .env.dev up -d
```

---

## 📦 Backup e Restore

### Backup do Database

```bash
# Backup do db.json
cp backend/db.json backend/db.backup.$(date +%Y%m%d_%H%M%S).json

# Ou automatizar
docker-compose exec backend tar czf /tmp/backup.tar.gz /app/db.json
docker cp demand-flow-backend:/tmp/backup.tar.gz ./backups/
```

### Restore do Database

```bash
# Parar backend
docker-compose stop backend

# Restaurar arquivo
cp backend/db.backup.XXXXXXXX.json backend/db.json

# Reiniciar
docker-compose start backend
```

---

## 🚀 Deploy em Produção

### Checklist Pré-Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] .env não está no repositório (.gitignore)
- [ ] Senhas fortes configuradas
- [ ] Backup configurado
- [ ] Logs configurados
- [ ] Monitoramento configurado
- [ ] SSL/HTTPS configurado (Nginx/Traefik)

### Deploy Simples

```bash
# No servidor
git pull origin main
docker-compose down
docker-compose up -d --build

# Verificar
docker-compose ps
docker-compose logs -f
```

### Deploy com Zero Downtime

```bash
# Build nova versão
docker-compose build

# Escalar temporariamente
docker-compose up -d --scale backend=2

# Atualizar gradualmente
docker-compose up -d --no-deps --build backend

# Verificar
docker-compose ps
curl http://localhost:3000/health
```

---

## 📝 Scripts Úteis

### Criar Script de Deploy

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Deploying Demand Flow..."

# Pull latest
git pull origin main

# Backup database
cp backend/db.json backend/db.backup.$(date +%Y%m%d).json

# Build and restart
docker-compose down
docker-compose up -d --build

# Wait for health
sleep 5
curl http://localhost:3000/health

echo "✅ Deploy complete!"
```

### Criar Script de Logs

```bash
#!/bin/bash
# logs.sh

SERVICE=${1:-all}

if [ "$SERVICE" = "all" ]; then
    docker-compose logs -f
else
    docker-compose logs -f $SERVICE
fi
```

---

## 🔍 Debugging

### Modo Interativo

```bash
# Abrir shell no container
docker-compose exec backend sh

# Executar comandos manualmente
cd /app
ls -la
cat db.json
npm run seed
```

### Ver Configurações

```bash
# Ver docker-compose renderizado
docker-compose config

# Ver variáveis de ambiente
docker-compose exec backend env
docker-compose exec frontend env
```

### Network Debugging

```bash
# Testar conexão backend ← → frontend
docker-compose exec frontend ping backend
docker-compose exec frontend curl http://backend:3000/health

# Ver rede Docker
docker network ls
docker network inspect demand-flow-network
```

---

## 📚 Recursos Adicionais

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 💡 Dicas e Boas Práticas

### 1. Sempre Use Volumes para Dados
```yaml
volumes:
  - ./backend/db.json:/app/db.json  # ✅ Correto
  # NÃO copiar para imagem!
```

### 2. Use .dockerignore
```
node_modules
*.log
.git
```

### 3. Multi-stage Builds
```dockerfile
FROM node:20 as builder
# Build aqui

FROM node:20-alpine
COPY --from=builder /app/dist /app
```

### 4. Health Checks
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### 5. Logs Estruturados
```javascript
console.log(JSON.stringify({
  timestamp: new Date(),
  level: 'info',
  message: 'Server started'
}));
```

---

**Docker torna o deploy simples e consistente! 🐳**

