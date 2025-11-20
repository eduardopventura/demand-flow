# 🐳 Docker - Guia Completo

> **Consolidação de**: DOCKER_MVP.md, DOCKER_GUIDE.md, DOCKER_FIX.md, REBUILD_FORCE.md

---

## 📋 Índice

1. [Quick Start](#quick-start)
2. [Arquitetura](#arquitetura)
3. [Ambientes](#ambientes)
4. [Comandos Úteis](#comandos-úteis)
5. [Troubleshooting](#troubleshooting)
6. [Rebuild e Manutenção](#rebuild-e-manutenção)

---

## 🚀 Quick Start

### Setup Inicial

```bash
# 1. Clone o repositório
git clone <seu-repo>
cd demand-flow

# 2. (Opcional) Ajuste o IP se necessário
# Edite: src/services/api.service.ts linha ~17
# const API_URL = "http://SEU-IP:3000/api";

# 3. Subir aplicação
docker-compose up -d --build

# 4. Acessar
# Frontend: http://192.168.1.4:3060
# Backend:  http://192.168.1.4:3000
```

### Verificar Status

```bash
# Status dos containers
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Health check do backend
curl http://192.168.1.4:3000/health
```

---

## 🏗️ Arquitetura

### Componentes

```
┌─────────────────────────────────────────┐
│         Navegador (Cliente)             │
│    http://192.168.1.4:3060              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Frontend Container (Nginx)            │
│   - React + Vite build                  │
│   - Servido por Nginx                   │
│   - Porta: 3060 → 80                    │
└──────────────┬──────────────────────────┘
               │ HTTP Requests
               │ http://192.168.1.4:3000/api
               ▼
┌─────────────────────────────────────────┐
│   Backend Container (JSON-Server)       │
│   - Express + JSON-Server               │
│   - API REST completa                   │
│   - Porta: 3000                         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Volume Persistente                    │
│   backend/db.json                       │
│   - Dados persistidos no host           │
└─────────────────────────────────────────┘
```

### Rede Docker

```yaml
Network: demand-flow-network (bridge)
  ├── backend (demand-flow-backend)
  └── frontend (demand-flow-frontend)
```

---

## 🌍 Ambientes

### Produção (Padrão)

```bash
# Subir
docker-compose up -d

# Parar
docker-compose down
```

**Configuração**:
- Frontend: `192.168.1.4:3060`
- Backend: `192.168.1.4:3000`
- Database: `backend/db.json`
- Rede: `demand-flow-network`

### Desenvolvimento (Paralelo)

```bash
# Subir (roda em paralelo com produção)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Parar
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

**Configuração**:
- Frontend: `192.168.1.4:3061` (porta diferente)
- Backend: `192.168.1.4:3001` (porta diferente)
- Database: `backend/db-dev.json` (arquivo separado)
- Rede: `demand-flow-dev-network` (rede separada)

**Vantagens**:
- Testa mudanças sem afetar produção
- Database completamente separado
- Mesmas configurações (alta fidelidade)
- Comparação lado a lado

---

## 🛠️ Comandos Úteis

### Gerenciamento Básico

```bash
# Subir (detached mode)
docker-compose up -d

# Subir com rebuild
docker-compose up -d --build

# Parar containers
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Restart de um serviço específico
docker-compose restart backend
docker-compose restart frontend
```

### Logs e Debug

```bash
# Ver todos os logs
docker-compose logs

# Logs em tempo real
docker-compose logs -f

# Logs de um serviço específico
docker-compose logs backend
docker-compose logs -f frontend

# Últimas 100 linhas
docker-compose logs --tail=100
```

### Inspeção

```bash
# Status dos containers
docker-compose ps

# Listar redes
docker network ls | grep demand-flow

# Inspecionar container
docker inspect demand-flow-backend
docker inspect demand-flow-frontend

# Ver uso de recursos
docker stats
```

### Acesso aos Containers

```bash
# Entrar no container backend
docker exec -it demand-flow-backend sh

# Entrar no container frontend
docker exec -it demand-flow-frontend sh

# Executar comando específico
docker exec demand-flow-backend ls -la /app
```

### Limpeza

```bash
# Remover containers parados
docker container prune

# Remover imagens não utilizadas
docker image prune

# Remover tudo (cuidado!)
docker system prune -a

# Limpar build cache
docker builder prune -a
```

---

## 🔧 Troubleshooting

### Container não inicia

**Sintoma**: `docker-compose ps` mostra container como `Exit` ou `Restarting`

**Solução**:
```bash
# Ver logs do erro
docker-compose logs backend

# Forçar rebuild
docker-compose down
docker-compose up --build --force-recreate
```

### Porta já em uso

**Sintoma**: `Error: bind: address already in use`

**Opção 1 - Mudar porta no docker-compose.yml**:
```yaml
services:
  frontend:
    ports:
      - "3061:80"  # Mudou de 3060 para 3061
  backend:
    ports:
      - "3001:3000"  # Mudou de 3000 para 3001
```

**Opção 2 - Matar processo na porta**:
```bash
# Windows
netstat -ano | findstr :3060
taskkill /PID <PID> /F

# Linux
lsof -i :3060
kill -9 <PID>
```

### Backend não responde (ERR_CONNECTION_REFUSED)

**Verificação**:
```bash
# 1. Container está rodando?
docker-compose ps
# Deve mostrar: backend (healthy)

# 2. Health check funciona?
curl http://192.168.1.4:3000/health

# 3. Ver logs
docker-compose logs backend
```

**Soluções**:
```bash
# Restart backend
docker-compose restart backend

# Rebuild backend
docker-compose stop backend
docker-compose rm backend
docker-compose up -d --build backend
```

### Frontend mostra "Usando dados locais"

**Causa**: Frontend não consegue conectar no backend

**Verificação**:
```bash
# 1. Backend está healthy?
docker-compose ps

# 2. IP está correto?
# Abrir F12 → Console
# Procurar: "API Service initialized with URL: http://192.168.1.4:3000/api"
# Se mostrar localhost ou outro IP, está errado

# 3. Backend responde?
curl http://192.168.1.4:3000/api/usuarios
```

**Soluções**:
```bash
# Se IP estiver errado:
# 1. Editar src/services/api.service.ts (linha ~17)
# 2. Rebuild frontend
docker-compose down
docker-compose up -d --build
```

### Cache antigo persistindo

**Sintoma**: Mudanças no código não aparecem após rebuild

**Solução**:
```bash
# Limpar tudo e rebuild do zero
docker-compose down --rmi all --volumes
docker builder prune -a -f
docker-compose up -d --build
```

### Database corrompido ou vazio

**Solução**:
```bash
# Resetar database para estado inicial
cd backend
npm run seed

# Ou copiar backup
cp db.backup.json db.json

# Restart backend
docker-compose restart backend
```

---

## 🔄 Rebuild e Manutenção

### Rebuild Completo (Recomendado após mudanças)

```bash
cd /caminho/para/demand-flow

# 1. Parar tudo
docker-compose down

# 2. Remover imagens antigas (opcional)
docker-compose down --rmi all

# 3. Rebuild sem cache
docker-compose build --no-cache

# 4. Subir
docker-compose up -d

# 5. Ver logs
docker-compose logs -f
```

### Rebuild Apenas Frontend

```bash
# Parar frontend
docker-compose stop frontend

# Remover container e imagem
docker rm demand-flow-frontend
docker rmi demand-flow-frontend

# Rebuild
docker-compose build --no-cache frontend

# Subir
docker-compose up -d frontend
```

### Rebuild Apenas Backend

```bash
# Parar backend
docker-compose stop backend

# Remover container e imagem
docker rm demand-flow-backend
docker rmi demand-flow-backend

# Rebuild
docker-compose build --no-cache backend

# Subir
docker-compose up -d backend
```

### Atualizar após mudança no código

```bash
# Se mudou APENAS código fonte (não docker-compose.yml ou Dockerfile)
docker-compose up -d --build

# Se mudou Dockerfile ou docker-compose.yml
docker-compose down
docker-compose up -d --build
```

### Backup e Restore

```bash
# Backup do database
cp backend/db.json backend/db.backup.$(date +%Y%m%d_%H%M%S).json

# Restore
cp backend/db.backup.20240119_150000.json backend/db.json
docker-compose restart backend

# Backup completo (incluindo imagens Docker)
docker save demand-flow-frontend > frontend-image.tar
docker save demand-flow-backend > backend-image.tar

# Restore de imagens
docker load < frontend-image.tar
docker load < backend-image.tar
```

---

## 📊 Monitoramento

### Health Checks

```bash
# Backend health
curl http://192.168.1.4:3000/health
# Deve retornar: {"status":"healthy","timestamp":"..."}

# Ver health no Docker
docker-compose ps
# Backend deve mostrar: "healthy"
```

### Uso de Recursos

```bash
# Ver uso de CPU/RAM em tempo real
docker stats

# Ver uso de disco
docker system df

# Ver logs de um período específico
docker-compose logs --since 1h backend
docker-compose logs --since "2024-01-19T10:00:00"
```

---

## 🎯 Checklist de Verificação

### Após Subir Containers

- [ ] Containers rodando: `docker-compose ps`
- [ ] Backend healthy: Status mostra "(healthy)"
- [ ] Backend responde: `curl http://192.168.1.4:3000/health`
- [ ] Frontend carrega: Abrir `http://192.168.1.4:3060`
- [ ] Console sem erros: F12 → Console
- [ ] API URL correta: Console mostra `http://192.168.1.4:3000/api`
- [ ] Dados persistem: Criar demanda → Reload → Ainda está lá

### Após Mudanças no Código

- [ ] Rebuild executado: `docker-compose up -d --build`
- [ ] Sem erros de build: Ver logs durante build
- [ ] Cache limpo (se necessário): `docker builder prune`
- [ ] Containers reiniciados: `docker-compose ps`
- [ ] Mudanças visíveis: Testar no navegador

---

## 📚 Referências Rápidas

### Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `docker-compose.yml` | Configuração de produção |
| `docker-compose.dev.yml` | Override para desenvolvimento |
| `Dockerfile` | Build do frontend |
| `backend/Dockerfile` | Build do backend |
| `nginx.conf` | Configuração do Nginx |
| `backend/db.json` | Database de produção |
| `backend/db-dev.json` | Database de desenvolvimento |

### Portas

| Ambiente | Frontend | Backend | Database |
|----------|----------|---------|----------|
| Produção | 3060 | 3000 | db.json |
| Dev | 3061 | 3001 | db-dev.json |

### URLs

```bash
# Produção
Frontend: http://192.168.1.4:3060
Backend:  http://192.168.1.4:3000
API:      http://192.168.1.4:3000/api
Health:   http://192.168.1.4:3000/health

# Dev
Frontend: http://192.168.1.4:3061
Backend:  http://192.168.1.4:3001
API:      http://192.168.1.4:3001/api
Health:   http://192.168.1.4:3001/health
```

---

## 🚀 Deploy em Servidor

### Preparação

```bash
# 1. Instalar Docker e Docker Compose no servidor
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Clonar projeto
git clone <seu-repo>
cd demand-flow

# 3. Ajustar IP se necessário
# Editar src/services/api.service.ts
```

### Deploy

```bash
# Build e subir
docker-compose up -d --build

# Verificar
docker-compose ps
docker-compose logs -f
```

### Configuração de Firewall

```bash
# Permitir portas no firewall (exemplo Ubuntu)
sudo ufw allow 3000/tcp
sudo ufw allow 3060/tcp
sudo ufw reload
```

---

**Versão**: 2.3.0  
**Última atualização**: 2025-11-19  
**Consolidação de**: DOCKER_MVP.md, DOCKER_GUIDE.md, DOCKER_FIX.md, REBUILD_FORCE.md

