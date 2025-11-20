# ⚡ Quick Guide - Referência Rápida

> **Consolidação de**: QUICK_START.md, QUICK_REFERENCE.md, CONFIG.md

---

## 📋 Índice

1. [Quick Start](#quick-start)
2. [Comandos Rápidos](#comandos-rápidos)
3. [Configuração](#configuração)
4. [URLs e Portas](#urls-e-portas)
5. [Troubleshooting Rápido](#troubleshooting-rápido)

---

## 🚀 Quick Start

### Setup em 3 Passos

```bash
# 1. Clone e entre no diretório
git clone <seu-repo>
cd demand-flow

# 2. (Opcional) Ajuste o IP se necessário
# Edite: src/services/api.service.ts linha ~17
# const API_URL = "http://SEU-IP:3000/api";

# 3. Suba a aplicação
docker-compose up -d --build
```

### Acessar

- **Frontend**: http://192.168.1.4:3060
- **Backend**: http://192.168.1.4:3000
- **Health**: http://192.168.1.4:3000/health

### Verificar

```bash
# Status
docker-compose ps

# Logs
docker-compose logs -f

# Health check
curl http://192.168.1.4:3000/health
```

---

## ⚡ Comandos Rápidos

### Produção

```bash
# Subir
docker-compose up -d
./scripts/start.sh

# Parar
docker-compose down
./scripts/stop.sh

# Rebuild
docker-compose down
docker-compose up -d --build

# Ver logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# Status
docker-compose ps
```

### Desenvolvimento (Paralelo)

```bash
# Subir dev (portas 3001/3061)
./scripts/start.sh dev
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Parar dev
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Ver logs dev
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
```

### Database

```bash
# Ver dados
cat backend/db.json

# Backup
cp backend/db.json backend/db.backup.$(date +%Y%m%d).json

# Resetar
cd backend && npm run seed

# Dev database
cat backend/db-dev.json
```

### Limpeza

```bash
# Remover containers
docker-compose down

# Remover com volumes
docker-compose down -v

# Limpar cache
docker system prune -f

# Rebuild do zero
docker-compose down --rmi all
docker-compose build --no-cache
docker-compose up -d
```

---

## ⚙️ Configuração

### Arquitetura

```
Frontend (React + Vite)
    ↓
API Service Layer
    ↓
Backend (JSON-Server)
    ↓
Database (db.json)
    ↓
Fallback (localStorage)
```

### Mudar IP/Porta

**Opção 1 - Editar código (Recomendado)**:

```bash
# 1. Abrir arquivo
code src/services/api.service.ts

# 2. Editar linha ~17
const API_URL = "http://SEU-NOVO-IP:3000/api";

# 3. Rebuild
docker-compose down
docker-compose up -d --build
```

**Opção 2 - Variável de ambiente (Opcional)**:

```bash
# 1. Criar .env na raiz
echo 'VITE_API_URL=http://192.168.1.100:3000/api' > .env

# 2. Rebuild
docker-compose down
docker-compose up -d --build
```

### Ambientes

| Ambiente | Frontend | Backend | Database | Rede |
|----------|----------|---------|----------|------|
| **Produção** | `:3060` | `:3000` | `db.json` | `demand-flow-network` |
| **Dev** | `:3061` | `:3001` | `db-dev.json` | `demand-flow-dev-network` |

### Estrutura de Arquivos

```
demand-flow/
├── docker-compose.yml          # Produção
├── docker-compose.dev.yml      # Dev (override)
├── Dockerfile                  # Build frontend
├── nginx.conf                  # Config Nginx
├── backend/
│   ├── Dockerfile             # Build backend
│   ├── server.js              # JSON-Server
│   ├── db.json                # Database prod
│   ├── db-dev.json            # Database dev
│   └── package.json
├── src/
│   ├── services/
│   │   ├── api.service.ts     # API calls (IP aqui!)
│   │   └── storage.service.ts # localStorage
│   ├── contexts/
│   │   └── DataContext.tsx    # State management
│   └── ...
├── docs/
│   ├── DOCKER.md              # Guia Docker completo
│   ├── IMPLEMENTATION.md      # Histórico técnico
│   ├── QUICK_GUIDE.md         # Este arquivo
│   └── MIGRATION.md           # Futuro PostgreSQL
├── scripts/
│   ├── start.sh               # Helper start
│   ├── stop.sh                # Helper stop
│   └── reset-db.sh            # Reset database
└── README.md                   # Overview
```

---

## 🌐 URLs e Portas

### Produção (Padrão)

```
Frontend:  http://192.168.1.4:3060
Backend:   http://192.168.1.4:3000
API:       http://192.168.1.4:3000/api
Health:    http://192.168.1.4:3000/health
```

### Desenvolvimento (Paralelo)

```
Frontend:  http://192.168.1.4:3061
Backend:   http://192.168.1.4:3001
API:       http://192.168.1.4:3001/api
Health:    http://192.168.1.4:3001/health
```

### API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Health check |
| GET | `/api` | API info |
| GET | `/api/usuarios` | Listar usuários |
| POST | `/api/usuarios` | Criar usuário |
| PATCH | `/api/usuarios/:id` | Atualizar usuário |
| DELETE | `/api/usuarios/:id` | Deletar usuário |
| GET | `/api/templates` | Listar templates |
| POST | `/api/templates` | Criar template |
| PATCH | `/api/templates/:id` | Atualizar template |
| DELETE | `/api/templates/:id` | Deletar template |
| GET | `/api/demandas` | Listar demandas |
| POST | `/api/demandas` | Criar demanda |
| PATCH | `/api/demandas/:id` | Atualizar demanda |
| DELETE | `/api/demandas/:id` | Deletar demanda |

---

## 🔧 Troubleshooting Rápido

### Container não inicia

```bash
# Ver logs do erro
docker-compose logs backend

# Forçar rebuild
docker-compose down
docker-compose up --build --force-recreate
```

### Porta já em uso

```bash
# Ver o que está usando a porta
netstat -ano | findstr :3060    # Windows
lsof -i :3060                   # Linux/Mac

# Matar processo
taskkill /PID <PID> /F          # Windows
kill -9 <PID>                   # Linux/Mac

# Ou mudar porta no docker-compose.yml
```

### Backend não responde

```bash
# Verificar status
docker-compose ps

# Ver logs
docker-compose logs backend

# Testar health
curl http://192.168.1.4:3000/health

# Restart
docker-compose restart backend
```

### Frontend mostra "Usando dados locais"

**Causa**: Frontend não conecta no backend

**Solução**:
```bash
# 1. Verificar console (F12)
# Deve mostrar: "API Service initialized with URL: http://192.168.1.4:3000/api"
# Se mostrar localhost ou outro IP, está errado

# 2. Corrigir IP
# Editar: src/services/api.service.ts linha ~17

# 3. Rebuild
docker-compose down
docker-compose up -d --build
```

### Dados não persistem

```bash
# Verificar volume
docker volume ls | grep demand-flow

# Ver db.json
cat backend/db.json

# Se vazio, resetar
cd backend && npm run seed

# Restart backend
docker-compose restart backend
```

### Cache antigo

```bash
# Limpar tudo
docker-compose down --rmi all --volumes
docker builder prune -a -f
docker-compose up -d --build

# Limpar cache do navegador
# Ctrl+Shift+Del ou F12 → Application → Clear storage
```

---

## 📊 Checklist de Verificação

### Após Subir

- [ ] Containers rodando: `docker-compose ps`
- [ ] Backend healthy: Status "(healthy)"
- [ ] Backend responde: `curl http://192.168.1.4:3000/health`
- [ ] Frontend carrega: Abrir no navegador
- [ ] Console sem erros: F12 → Console
- [ ] API URL correta: Console mostra IP correto (não localhost)
- [ ] Dados persistem: Criar demanda → Reload → Ainda está lá

### Após Mudanças

- [ ] Rebuild: `docker-compose up -d --build`
- [ ] Sem erros de build: Ver logs
- [ ] Containers reiniciados: `docker-compose ps`
- [ ] Mudanças visíveis: Testar funcionalidade

---

## 🎯 Casos de Uso Comuns

### Desenvolver Nova Feature

```bash
# 1. Subir ambiente dev paralelo
./scripts/start.sh dev

# 2. Fazer mudanças no código

# 3. Rebuild apenas frontend
docker-compose stop frontend
docker-compose up -d --build frontend

# 4. Testar em http://192.168.1.4:3061

# 5. Se OK, aplicar em produção
docker-compose down
docker-compose up -d --build

# 6. Testar em http://192.168.1.4:3060
```

### Resetar Database

```bash
# Backup atual
cp backend/db.json backend/db.backup.$(date +%Y%m%d_%H%M%S).json

# Resetar para estado inicial
cd backend
npm run seed

# Restart backend
cd ..
docker-compose restart backend
```

### Deploy em Servidor

```bash
# 1. Instalar Docker no servidor
curl -fsSL https://get.docker.com | sh

# 2. Clonar projeto
git clone <repo>
cd demand-flow

# 3. Ajustar IP
# Editar src/services/api.service.ts

# 4. Subir
docker-compose up -d --build

# 5. Verificar
docker-compose ps
docker-compose logs -f

# 6. Configurar firewall
sudo ufw allow 3000/tcp
sudo ufw allow 3060/tcp
```

### Backup e Restore

```bash
# Backup completo
mkdir -p backups
cp backend/db.json backups/db.$(date +%Y%m%d_%H%M%S).json
docker save demand-flow-backend > backups/backend-image.tar
docker save demand-flow-frontend > backups/frontend-image.tar

# Restore
cp backups/db.20250119_150000.json backend/db.json
docker load < backups/backend-image.tar
docker load < backups/frontend-image.tar
docker-compose restart
```

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

- **[README.md](../README.md)** - Overview do projeto
- **[docs/DOCKER.md](./DOCKER.md)** - Guia Docker completo
- **[docs/IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Histórico técnico
- **[docs/MIGRATION.md](./MIGRATION.md)** - Migração PostgreSQL
- **[CHANGELOG.md](../CHANGELOG.md)** - Histórico de versões
- **[SECURITY.md](../SECURITY.md)** - Segurança

---

## 💡 Dicas

- Use `./scripts/start.sh` ao invés de digitar comando completo
- Ambiente dev roda **em paralelo** com prod, sem conflito
- Fallback localStorage funciona automaticamente se backend cair
- Database dev (`db-dev.json`) é separado de prod
- Ctrl+C nos logs não para os containers (modo detached)
- Use `docker-compose down` para parar containers

---

## 🆘 Ajuda

**Problemas?**
1. Ver logs: `docker-compose logs -f`
2. Consultar: [docs/DOCKER.md](./DOCKER.md) seção Troubleshooting
3. Verificar health: `curl http://192.168.1.4:3000/health`

**Dúvidas técnicas?**
1. Consultar: [docs/IMPLEMENTATION.md](./IMPLEMENTATION.md)
2. Ver exemplos: `src/contexts/DataContext.tsx`

---

**Versão**: 2.3.0  
**Última atualização**: 2025-11-19  
**Consolidação de**: QUICK_START.md, QUICK_REFERENCE.md, CONFIG.md

