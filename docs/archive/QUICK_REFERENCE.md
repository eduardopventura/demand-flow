# 🚀 Quick Reference - Demand Flow v2.2

## ⚡ Comandos Rápidos

### Iniciar Projeto
```bash
# Desenvolvimento (hot-reload)
./scripts/start.sh dev

# Produção
./scripts/start.sh

# Ou manualmente
docker-compose up -d
```

### Parar Projeto
```bash
./scripts/stop.sh
# Ou
docker-compose down
```

### Resetar Database
```bash
./scripts/reset-db.sh
```

### Ver Logs
```bash
# Backend
docker-compose logs -f backend

# Frontend
docker-compose logs -f frontend

# Ambos
docker-compose logs -f
```

---

## 🌐 URLs

### Desenvolvimento Local (sem Docker)
| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost:8080 | Interface React |
| Backend API | http://localhost:3000 | JSON-Server |
| Health Check | http://localhost:3000/health | Status da API |

### Docker (Produção)
| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost:3060 | Interface React (Nginx) |
| Backend API | http://localhost:3000 | JSON-Server |
| Health Check | http://localhost:3000/health | Status da API |

> **Nota**: Se acessando de outro dispositivo na rede, substitua `localhost` pelo IP do host (ex: `192.168.1.4:3060`)

---

## 📁 Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| `src/contexts/DataContext.tsx` | Estado global + API integration |
| `src/services/api.service.ts` | Camada de abstração API |
| `backend/server.js` | Servidor JSON-Server |
| `backend/db.json` | Database (editável) |
| `docker-compose.yml` | Orquestração Docker |

---

## 🔧 Troubleshooting Rápido

### Porta já em uso
Edite `docker-compose.yml`:
```yaml
ports:
  - "8081:8080"  # Frontend
  - "3001:3000"  # Backend
```

### Container não inicia
```bash
docker-compose down
docker-compose up --build --force-recreate
```

### Database vazio/corrompido
```bash
./scripts/reset-db.sh
```

### Backend não conecta
1. Verificar se está rodando: `docker-compose ps`
2. Ver logs: `docker-compose logs backend`
3. Testar health: `curl http://localhost:3000/health` ou `http://SEU-IP:3000/health`

### Frontend usa localStorage ao invés da API (Docker)
**Sintoma**: Mensagem "Usando dados locais. Verifique se o backend está rodando"

**Causa**: API_URL incorreta (usando `localhost` dentro do container)

**Solução aplicada em v2.2.1**:
- ✅ Auto-detecção de URL via `window.location.hostname`
- ✅ Funciona automaticamente em dev e prod

**Como aplicar**:
```bash
docker-compose down
docker-compose up -d --build
```

**Verificar se funcionou**:
- Abrir F12 → Console
- Procurar: `🔌 API Service initialized with URL: http://SEU-IP:3000/api`
- NÃO deve aparecer: "Usando dados locais"

**Documentação completa**: Ver [DOCKER_FIX.md](./DOCKER_FIX.md)

---

## 📚 Documentação Principal

| Doc | Quando Usar |
|-----|-------------|
| [README.md](./README.md) | Visão geral |
| [DOCKER_MVP.md](./DOCKER_MVP.md) | Setup Docker |
| [API_INTEGRATION.md](./API_INTEGRATION.md) | Detalhes API |
| [MIGRATION_COMPLETED.md](./MIGRATION_COMPLETED.md) | Resumo migração |
| [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) | Comandos Docker |

---

## 🎯 Fluxo de Dados

```
Usuario Action
    ↓
DataContext (frontend)
    ↓
api.service.ts
    ↓
HTTP Request
    ↓
backend/server.js (JSON-Server)
    ↓
backend/db.json (persistência)
```

**Fallback:**
```
API Error
    ↓
storageService.ts
    ↓
localStorage (cache/backup)
```

---

## 🧪 Testar Rapidamente

```bash
# 1. Subir tudo
./scripts/start.sh dev

# 2. Abrir frontend
open http://localhost:8080

# 3. Criar algo (usuário/template/demanda)

# 4. Verificar db.json
cat backend/db.json

# 5. Recarregar página - dados persistem!
```

---

## 📊 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/usuarios` | Listar usuários |
| POST | `/api/usuarios` | Criar usuário |
| PATCH | `/api/usuarios/:id` | Atualizar usuário |
| DELETE | `/api/usuarios/:id` | Deletar usuário |
| GET | `/api/templates` | Listar templates |
| POST | `/api/templates` | Criar template |
| GET | `/api/demandas` | Listar demandas |
| POST | `/api/demandas` | Criar demanda |
| PATCH | `/api/demandas/:id` | Atualizar demanda |
| GET | `/health` | Health check |

---

## 🎨 Features Implementadas

- ✅ Sistema fullstack completo
- ✅ API REST funcional
- ✅ Persistência real (db.json)
- ✅ Loading states
- ✅ Error handling
- ✅ Toast notifications
- ✅ Fallback localStorage
- ✅ Cache inteligente
- ✅ Docker containerizado
- ✅ Hot-reload desenvolvimento

---

## 🚀 Deploy Rápido

```bash
# No servidor (AWS, DigitalOcean, etc)
git clone <seu-repo>
cd demand-flow
docker-compose up -d --build

# Acessar via IP público
http://<seu-ip>:8080
```

---

## 📞 Ajuda

**Problemas?**
- Ver logs: `docker-compose logs -f`
- Consultar: [DOCKER_GUIDE.md](./DOCKER_GUIDE.md)
- API docs: [backend/README.md](./backend/README.md)

**Dúvidas sobre código?**
- Consultar: [API_INTEGRATION.md](./API_INTEGRATION.md)
- Ver exemplos em: `src/contexts/DataContext.tsx`

---

**Sistema pronto para uso! 🎉**

