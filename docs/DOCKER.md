# 🐳 Docker - Guia Completo

Documentação completa da infraestrutura Docker do projeto Demand Flow.

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Arquivos Docker](#-arquivos-docker)
3. [Arquitetura](#-arquitetura)
4. [Comandos](#-comandos)
5. [Volumes e Persistência](#-volumes-e-persistência)
6. [Rede Docker](#-rede-docker)
7. [Troubleshooting](#-troubleshooting)

---

## 🔍 Visão Geral

O projeto é 100% dockerizado:

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| Frontend | 3060 | React + Nginx |
| Backend | 3000 | Node.js + Express + Prisma |
| PostgreSQL | 5432 | Banco de dados relacional (interno) |

**URLs de Acesso:**
- Frontend: http://localhost:3060
- Backend: http://localhost:3000
- API: http://localhost:3060/api (via proxy)

---

## 📁 Arquivos Docker

### Estrutura de Arquivos

```
demand-flow/
├── docker-compose.yml        # Configuração Docker
├── frontend/
│   ├── Dockerfile            # Build do frontend
│   └── nginx.conf            # Configuração Nginx (frontend)
├── backend/
│   └── Dockerfile            # Build do backend
```

### `docker-compose.yml`

Arquivo principal que define os serviços:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: demand-flow-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: demandflow
      POSTGRES_USER: demandflow
      POSTGRES_PASSWORD: demandflow_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - demand-flow-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U demandflow"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: edpv/demand-flow-backend:latest
    container_name: demand-flow-backend
    restart: unless-stopped
    volumes:
      - ./uploads:/app/uploads
      - ./backend/.env:/app/.env
    env_file:
      - ./backend/.env
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://demandflow:demandflow_password@postgres:5432/demandflow
      - JWT_EXPIRES_IN=24h
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - demand-flow-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: edpv/demand-flow-frontend:latest
    container_name: demand-flow-frontend
    restart: unless-stopped
    ports:
      - "3060:80"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - demand-flow-network

networks:
  demand-flow-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
```

### `frontend/Dockerfile` (Frontend)

Build multi-stage para o frontend React:

```dockerfile
# Stage 1: Build
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Produção
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**Características:**
- Multi-stage build (imagem final pequena)
- Node 20 Alpine para build
- Nginx Alpine para servir
- Health check configurado

### `backend/Dockerfile` (Backend)

Container Node.js para o backend:

```dockerfile
FROM node:20-alpine

# Dependências para Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --omit=dev

# Gerar Prisma Client
RUN npx prisma generate

# Copiar código
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

**Características:**
- Node 20 Alpine
- OpenSSL e libc6-compat para Prisma
- Prisma Client gerado no build
- Apenas dependências de produção
- Health check configurado

### `nginx.conf`

Configuração do Nginx para o frontend:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy para API
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy para WebSockets (Socket.io)
    location /socket.io {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Importantes:**
- Proxy `/api` → backend:3000 (resolve CORS)
- SPA fallback para React Router
- Gzip para performance
- Security headers

---

## 🏗️ Arquitetura

### Fluxo de Requisições

```
┌─────────────────────────────────────────┐
│           Navegador (Cliente)           │
│      http://localhost:3060              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Frontend Container (Nginx)         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ /          → index.html (React) │   │
│  │ /api/*     → proxy → backend    │   │
│  │ /health    → 200 OK             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  - Porta interna: 80                    │
│  - Porta exposta: 3060                  │
└──────────────┬──────────────────────────┘
               │ HTTP (via proxy)
               │ http://backend:3000
               ▼
┌─────────────────────────────────────────┐
│      Backend Container (Node.js)        │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Express + Prisma ORM            │   │
│  │ API REST                        │   │
│  │ Socket.io (WebSockets)          │   │
│  │ Lógica de Negócio               │   │
│  │ Notificações (Email, WhatsApp)  │   │
│  │ Autenticação JWT                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  - Porta: 3000                          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   PostgreSQL Container (16-alpine)      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Banco de Dados Relacional      │   │
│  │ Prisma Client                   │   │
│  │ Migrations                      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  - Porta: 5432 (interno)               │
│  - Volume: postgres_data               │
└─────────────────────────────────────────┘
```

### Por que o Proxy?

O Nginx faz proxy das requisições `/api` para o backend porque:

1. **Evita CORS:** Requisições vêm do mesmo domínio
2. **HTTPS:** Não há Mixed Content (HTTPS → HTTP)
3. **Simplifica:** Frontend usa apenas `/api` (path relativo)
4. **DNS Docker:** Nginx resolve "backend" via DNS interno

---

## 🛠️ Comandos

### Gerenciamento Básico

```bash
# Subir (background)
docker-compose up -d

# Subir com rebuild
docker-compose up -d --build

# Parar containers
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Restart específico
docker-compose restart backend
docker-compose restart frontend
```

### Logs e Debug

```bash
# Todos os logs
docker-compose logs

# Logs em tempo real
docker-compose logs -f

# Logs de serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Últimas 100 linhas
docker-compose logs --tail=100
```

### Inspeção

```bash
# Status dos containers
docker-compose ps

# Uso de recursos
docker stats

# Inspecionar container
docker inspect demand-flow-backend
```

### Acesso aos Containers

```bash
# Shell no backend
docker exec -it demand-flow-backend sh

# Shell no frontend
docker exec -it demand-flow-frontend sh

# Executar comando
docker exec demand-flow-backend ls -la /app
```

### Limpeza

```bash
# Remover containers parados
docker container prune

# Remover imagens não utilizadas
docker image prune

# Limpar tudo (cuidado!)
docker system prune -a

# Limpar cache de build
docker builder prune -a
```

---

## 💾 Volumes e Persistência

### Volumes Configurados

```yaml
volumes:
  postgres_data:                    # Volume nomeado para PostgreSQL
    driver: local
  ./uploads:/app/uploads            # Bind mount para arquivos
  ./backend/.env:/app/.env          # Bind mount para configurações
```

**PostgreSQL (Volume Nomeado):**
- Dados persistem em `postgres_data` mesmo após `docker-compose down`
- Volume gerenciado pelo Docker
- Backup via `pg_dump` ou backup do volume

**Uploads (Bind Mount):**
- Arquivos enviados pelos usuários
- Persistem no diretório `./uploads` do host
- Fácil acesso para backup

### Backup do PostgreSQL

```bash
# Backup do banco de dados
docker exec demand-flow-postgres pg_dump -U demandflow demandflow > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker exec -i demand-flow-postgres psql -U demandflow demandflow < backup_20241207_150000.sql

# Backup do volume completo
docker run --rm -v demand-flow_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup_$(date +%Y%m%d_%H%M%S).tar.gz /data
```

---

## 🌐 Rede Docker

### Configuração

```yaml
networks:
  demand-flow-network:
    driver: bridge
    name: demand-flow-network
```

### DNS Interno

Dentro da rede Docker, os serviços se encontram por nome:
- `backend` → resolve para IP do container backend
- `frontend` → resolve para IP do container frontend

**Exemplo:** Nginx usa `proxy_pass http://backend:3000`

### Verificar Rede

```bash
# Listar redes
docker network ls | grep demand-flow

# Inspecionar rede
docker network inspect demand-flow-network
```

---

## 🔧 Troubleshooting

### Container não inicia

```bash
# Ver erro
docker-compose logs backend

# Forçar rebuild
docker-compose down
docker-compose up --build --force-recreate
```

### Porta em uso

```bash
# Linux - verificar processo
lsof -i :3060
kill -9 <PID>

# Ou mudar porta no docker-compose.yml
ports:
  - "3061:80"  # Nova porta
```

### Backend não responde

```bash
# Verificar se está rodando
docker-compose ps

# Verificar health
curl http://localhost:3000/health

# Ver logs
docker-compose logs backend
```

### Frontend não conecta ao backend

**Verificar:**
1. Backend está healthy? `docker-compose ps`
2. Console do browser mostra erro?
3. Nginx está fazendo proxy?

```bash
# Testar API diretamente
curl http://localhost:3000/api/usuarios

# Testar via frontend (proxy)
curl http://localhost:3060/api/usuarios
```

### Cache antigo

```bash
# Limpar tudo e rebuild
docker-compose down --rmi all --volumes
docker builder prune -a -f
docker-compose up -d --build
```

### Database corrompido

```bash
# Verificar conexão com PostgreSQL
docker exec demand-flow-postgres psql -U demandflow -c "SELECT 1"

# Verificar migrations
docker exec demand-flow-backend npx prisma migrate status

# Restaurar backup
docker exec -i demand-flow-postgres psql -U demandflow demandflow < backup.sql

# Reset completo (CUIDADO: apaga todos os dados)
docker-compose down -v
docker-compose up -d
```

---

## 📋 Checklist de Deploy

### Após subir containers

- [ ] Containers rodando: `docker-compose ps`
- [ ] Backend healthy: Status mostra "(healthy)"
- [ ] Backend responde: `curl http://localhost:3000/health`
- [ ] Frontend carrega: Abrir http://localhost:3060
- [ ] Console sem erros: F12 → Console
- [ ] Criar demanda e verificar persistência

### Após mudanças no código

- [ ] Rebuild: `docker-compose up -d --build`
- [ ] Sem erros de build nos logs
- [ ] Cache limpo se necessário
- [ ] Mudanças visíveis no browser

---

## 📊 Referências Rápidas

### Portas

| Serviço | Porta |
|---------|-------|
| Frontend | 3060 |
| Backend | 3000 |

### Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `docker-compose.yml` | Configuração Docker |
| `Dockerfile` | Build frontend |
| `backend/Dockerfile` | Build backend |
| `nginx.conf` | Config Nginx |
| `backend/prisma/schema.prisma` | Schema Prisma |
| `backend/.env` | Variáveis de ambiente |
| `postgres_data` | Volume PostgreSQL |

---

**Versão:** 1.0.0  
**Última Atualização:** 18/12/2025
