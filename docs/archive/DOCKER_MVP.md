# 🐳 Docker MVP - Demand Flow

## 🎉 Implementação Completa!

Seu projeto agora está **100% dockerizado** e pronto para rodar em qualquer lugar!

---

## 📦 O Que Foi Implementado

### ✅ Backend (JSON-Server)
- API REST completa
- Persistência de dados em `db.json`
- Health checks
- CORS habilitado
- Logs estruturados
- Pronto para upgrade PostgreSQL

### ✅ Frontend (React + Vite)
- Build otimizado com Nginx
- Variáveis de ambiente configuráveis
- Hot reload em desenvolvimento
- Gzip compression
- Cache de assets

### ✅ Docker Setup
- `docker-compose.yml` - Produção
- `docker-compose.dev.yml` - Desenvolvimento
- Multi-stage builds otimizados
- Health checks automáticos
- Volumes persistentes

### ✅ API Service Layer
- Abstração completa da API
- Pronto para trocar backend
- Type-safe com TypeScript
- Error handling

### ✅ Documentação
- `DOCKER_GUIDE.md` - Guia completo Docker
- `MIGRATION_GUIDE.md` - Como migrar para PostgreSQL
- `DOCKER_MVP.md` - Este arquivo
- Scripts de desenvolvimento

### ✅ Scripts
- `./scripts/start.sh` - Iniciar serviços
- `./scripts/stop.sh` - Parar serviços
- `./scripts/reset-db.sh` - Resetar database
- `backend/scripts/seed.js` - Seed inicial

---

## 🚀 Como Usar (Quick Start)

### 1. Primeira Vez

```bash
# 1. Instalar dependências do backend (opcional, só se quiser rodar local)
cd backend && npm install && cd ..

# 2. Subir com Docker
docker-compose up -d

# 3. Verificar
docker-compose ps
docker-compose logs -f
```

### 2. Acessar

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3000/api
- **Health Check:** http://localhost:3000/health

### 3. Testar API

```bash
# Ver todos os usuários
curl http://localhost:3000/api/usuarios

# Ver todas as demandas
curl http://localhost:3000/api/demandas

# Criar nova demanda
curl -X POST http://localhost:3000/api/demandas \
  -H "Content-Type: application/json" \
  -d '{"nome_demanda":"Teste","status":"Criada",...}'
```

---

## 📊 Estrutura Criada

```
demand-flow/
├── 🐳 Docker Files
│   ├── docker-compose.yml          # Produção
│   ├── docker-compose.dev.yml      # Desenvolvimento
│   ├── Dockerfile                  # Frontend (produção)
│   ├── Dockerfile.dev              # Frontend (dev)
│   ├── nginx.conf                  # Nginx config
│   └── .dockerignore               # Ignorar files
│
├── 🔧 Backend (JSON-Server MVP)
│   ├── backend/
│   │   ├── server.js               # ✨ Servidor API
│   │   ├── db.json                 # ✨ Database
│   │   ├── package.json            # ✨ Dependencies
│   │   ├── Dockerfile              # ✨ Backend image
│   │   └── scripts/
│   │       └── seed.js             # ✨ Reset database
│
├── 🎨 Frontend (sem mudanças!)
│   ├── src/
│   │   ├── services/
│   │   │   └── api.service.ts      # ✨ API abstraction
│   │   └── ... (resto igual)
│
├── 📜 Scripts
│   ├── scripts/
│   │   ├── start.sh                # ✨ Start services
│   │   ├── stop.sh                 # ✨ Stop services
│   │   └── reset-db.sh             # ✨ Reset database
│
├── 📚 Documentação
│   ├── DOCKER_GUIDE.md             # ✨ Guia Docker completo
│   ├── MIGRATION_GUIDE.md          # ✨ Como migrar para PostgreSQL
│   ├── DOCKER_MVP.md               # ✨ Este arquivo
│   └── ... (outros docs)
│
└── ⚙️ Config
    ├── .env                        # ✨ Environment vars
    └── .env.example                # ✨ Template

✨ = Novo arquivo criado
```

---

## 🎯 Endpoints da API

### Usuários
```
GET    /api/usuarios       - Listar todos
GET    /api/usuarios/:id   - Buscar por ID
POST   /api/usuarios       - Criar novo
PATCH  /api/usuarios/:id   - Atualizar
DELETE /api/usuarios/:id   - Deletar
```

### Templates
```
GET    /api/templates       - Listar todos
GET    /api/templates/:id   - Buscar por ID
POST   /api/templates       - Criar novo
PATCH  /api/templates/:id   - Atualizar
DELETE /api/templates/:id   - Deletar
```

### Demandas
```
GET    /api/demandas       - Listar todas
GET    /api/demandas/:id   - Buscar por ID
POST   /api/demandas       - Criar nova
PATCH  /api/demandas/:id   - Atualizar
DELETE /api/demandas/:id   - Deletar
```

### Utilitários
```
GET    /health             - Health check
GET    /api                - API info
POST   /api/auth/login     - Login (mock)
```

---

## 📝 Variáveis de Ambiente

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3000/api
```

### Backend (docker-compose.yml)
```bash
NODE_ENV=production
PORT=3000
```

---

## 🔄 Comandos Úteis

### Desenvolvimento
```bash
# Subir com hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Ou usar script
./scripts/start.sh dev

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Produção
```bash
# Build e subir
docker-compose up -d --build

# Ou usar script
./scripts/start.sh prod

# Parar
docker-compose down

# Ou usar script
./scripts/stop.sh
```

### Database
```bash
# Resetar database
./scripts/reset-db.sh

# Ou manual
cd backend && npm run seed
docker-compose restart backend

# Backup
cp backend/db.json backend/db.backup.$(date +%Y%m%d).json
```

### Debugging
```bash
# Shell no backend
docker-compose exec backend sh

# Shell no frontend
docker-compose exec frontend sh

# Ver configuração
docker-compose config

# Ver estatísticas
docker stats
```

---

## 🎨 Frontend Atualizado (API Integrada) ✅

O frontend agora está **TOTALMENTE INTEGRADO** com a API!

### Sistema Atual:
```typescript
// DataContext.tsx - INTEGRADO COM API
import { apiService } from "@/services/api.service";

// Carrega dados da API na inicialização
useEffect(() => {
  const loadData = async () => {
    const [usuarios, templates, demandas] = await Promise.all([
      apiService.getUsuarios(),
      apiService.getTemplates(),
      apiService.getDemandas(),
    ]);
    // Estado atualizado com dados da API
  };
  loadData();
}, []);

// Todas as operações usam API
const addUsuario = async (usuario) => {
  const novo = await apiService.createUsuario(usuario);
  setUsuarios([...usuarios, novo]);
  toast.success("Usuário criado!");
};
```

### Recursos Implementados:

✅ **API First** - Todas operações usam backend JSON-Server
✅ **Loading States** - Feedback visual durante carregamento
✅ **Error Handling** - Tratamento robusto de erros
✅ **Fallback Automático** - Usa localStorage se API falhar
✅ **Cache Local** - Backup automático para modo offline
✅ **Toast Notifications** - Feedback para usuário
✅ **Retry Logic** - Tenta API primeiro, fallback depois

### Como Funciona:

1. **Inicialização:** Carrega dados da API
2. **Operações CRUD:** Enviadas para API
3. **Erro na API?** Fallback para localStorage automaticamente
4. **Sempre sincronizado:** Cache local mantido atualizado

**Status:** Sistema fullstack funcional! 🚀

---

## 🔀 Migration Path

### MVP Atual (JSON-Server) → Produção (PostgreSQL)

1. **Fase 1: MVP** ✅ (Você está aqui!)
   - JSON-Server como backend
   - db.json como database
   - Perfeito para desenvolvimento e demos

2. **Fase 2: PostgreSQL** (Quando escalar)
   - Adicionar serviço PostgreSQL no docker-compose
   - Substituir backend/server.js por Express + Prisma
   - Migrar dados de db.json para PostgreSQL
   - Frontend continua igual!

**Ver `MIGRATION_GUIDE.md` para detalhes completos.**

---

## 🎯 Próximos Passos Sugeridos

### Curto Prazo (Esta Semana)
1. ✅ Testar localmente com Docker
2. ✅ DataContext integrado com API (COMPLETO!)
3. ⏳ Testar todos os fluxos da aplicação
4. ⏳ Fazer backup do db.json

### Médio Prazo (Este Mês)
1. ⏳ Deploy em servidor (DigitalOcean, AWS, etc)
2. ⏳ Configurar domínio e SSL
3. ⏳ Implementar autenticação real
4. ⏳ Configurar backups automáticos

### Longo Prazo (Próximos Meses)
1. ⏳ Migrar para PostgreSQL
2. ⏳ Adicionar Redis para cache
3. ⏳ Implementar WebSockets
4. ⏳ Kubernetes para escala

---

## 💡 Vantagens da Implementação

### ✅ Portabilidade
```bash
# Funciona em qualquer máquina com Docker
git clone <repo>
docker-compose up -d
# Pronto!
```

### ✅ Consistência
```bash
# Mesmo ambiente em:
- Desenvolvimento local
- Servidor de staging
- Produção
- CI/CD
```

### ✅ Isolamento
```bash
# Não polui sua máquina
# Fácil de limpar
docker-compose down -v
```

### ✅ Escalabilidade
```bash
# Fácil de escalar
docker-compose up -d --scale backend=3
```

### ✅ Upgrade Simples
```bash
# Trocar JSON-Server → PostgreSQL
# Apenas mudar docker-compose.yml
# Frontend continua funcionando!
```

---

## 🐛 Troubleshooting Rápido

### Porta já em uso
```bash
# Mudar porta no docker-compose.yml
ports:
  - "3001:3000"  # Usar 3001
```

### Container não inicia
```bash
# Ver logs
docker-compose logs backend

# Rebuild
docker-compose up --build --force-recreate
```

### Database vazio
```bash
# Resetar
./scripts/reset-db.sh
```

### Frontend não conecta
```bash
# Verificar VITE_API_URL
cat .env

# Deve ser: http://localhost:3000/api
```

**Ver `DOCKER_GUIDE.md` para troubleshooting completo.**

---

## 📚 Documentação Completa

| Documento | Descrição |
|-----------|-----------|
| [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) | Guia completo de Docker |
| [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) | Como migrar para PostgreSQL |
| [DOCKER_MVP.md](./DOCKER_MVP.md) | Este arquivo - overview |
| [README.md](./README.md) | Getting started geral |

---

## 🎉 Conclusão

Seu projeto agora está **100% dockerizado** e pronto para:

- ✅ Desenvolver localmente
- ✅ Deploy em qualquer servidor
- ✅ Escalar conforme necessário
- ✅ Migrar para PostgreSQL facilmente
- ✅ Compartilhar com equipe
- ✅ CI/CD pipeline

**Arquitetura pensada para crescer com seu projeto!** 🚀

---

## 🙋 Perguntas Frequentes

### Como rodar apenas o backend?
```bash
docker-compose up backend -d
```

### Como rodar apenas o frontend?
```bash
docker-compose up frontend -d
```

### Como ver o database?
```bash
# Opção 1: Arquivo direto
cat backend/db.json

# Opção 2: Via API
curl http://localhost:3000/api/usuarios | jq
```

### Como fazer backup?
```bash
# Copiar db.json
cp backend/db.json backups/db-$(date +%Y%m%d).json

# Ou via Docker
docker cp demand-flow-backend:/app/db.json ./backup.json
```

### Como deploy em produção?
```bash
# 1. No servidor
git pull
docker-compose down
docker-compose up -d --build

# 2. Verificar
docker-compose ps
curl http://localhost:3000/health
```

---

**Happy coding! 🎉**

Se tiver dúvidas, consulte os guias ou abra uma issue!

