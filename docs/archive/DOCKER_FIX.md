# 🔧 Docker Frontend-Backend Connection Fix

## 🐛 Problema Identificado

O frontend não estava conectando ao backend porque:

1. **API_URL hardcoded**: Frontend tentava acessar `http://localhost:3000/api`
2. **Docker networking**: Dentro do container, `localhost` aponta para o próprio container
3. **Configuração incorreta**: `VITE_API_URL` definida em runtime (não funciona com Vite)

## ✅ Solução Implementada

### 1. Auto-detecção da API URL (v2.2.2 - Simplificada)

**Arquivo modificado**: `src/services/api.service.ts`

```typescript
// Auto-detect API URL based on environment
const getApiUrl = (): string => {
  // 1. Check if explicitly set via env variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  const hostname = window.location.hostname;
  
  // 2. If accessing via localhost/127.0.0.1, assume local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return "http://localhost:3000/api";
  }
  
  // 3. Otherwise, use the current hostname (Docker/Network)
  return `http://${hostname}:3000/api`;
};
```

**Como funciona (SIMPLIFICADO)**:
- **Acesso via localhost/127.0.0.1**: Usa `http://localhost:3000/api`
- **Acesso via qualquer outro hostname** (ex: `192.168.1.4`): Usa `http://192.168.1.4:3000/api`
- **Não depende de `import.meta.env.PROD`**: Funciona independente do modo de build
- **Debug logs**: Mostra no console qual modo foi detectado

**Por que a versão anterior falhou**:
- Dependia de `import.meta.env.PROD` que pode não estar configurado corretamente
- Cache do build anterior mantinha a versão dev
- Nova versão usa apenas o `window.location.hostname` (sempre disponível)

### 2. Docker Compose Simplificado

**Arquivo modificado**: `docker-compose.yml` e `docker-compose.dev.yml`

- Removido `VITE_API_URL` de build args (não necessário)
- Removido `environment.VITE_API_URL` (não funciona em runtime)
- Mantido `depends_on` + `healthcheck` para garantir ordem de inicialização

### 3. Logging para Debug

Adicionado log no console do navegador:
```typescript
console.log(`🔌 API Service initialized with URL: ${API_URL}`);
```

## 🚀 Como Aplicar a Correção

### Opção 1: Rebuild Completo (Recomendado)

```powershell
# No PowerShell/CMD do Windows
cd V:\demand-flow

# Parar containers
docker-compose down

# Limpar imagens antigas
docker-compose down --rmi all

# Rebuild e start
docker-compose up -d --build

# Ver logs
docker-compose logs -f
```

### Opção 2: Rebuild Apenas do Frontend

```powershell
cd V:\demand-flow

# Parar apenas frontend
docker-compose stop frontend

# Rebuild frontend
docker-compose build --no-cache frontend

# Start tudo
docker-compose up -d

# Ver logs do frontend
docker-compose logs -f frontend
```

## 🧪 Como Testar

### 1. Verificar se os containers estão rodando

```powershell
docker-compose ps
```

**Esperado**:
```
NAME                    STATUS              PORTS
demand-flow-backend     Up (healthy)        0.0.0.0:3000->3000/tcp
demand-flow-frontend    Up                  0.0.0.0:3060->80/tcp
```

### 2. Testar o Backend diretamente

```powershell
curl http://192.168.1.4:3000/health
```

**Esperado**:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-19T...",
  "version": "1.0.0",
  "database": "json-server"
}
```

### 3. Verificar Frontend no Navegador

1. Abrir: `http://192.168.1.4:3060`
2. Abrir DevTools (F12) → Console
3. Procurar: `🔌 API Service initialized with URL: http://192.168.1.4:3000/api`

### 4. Criar uma demanda de teste

1. Clicar em **"+ Nova Demanda"**
2. Preencher formulário
3. Salvar

**Se funcionar**: A demanda aparecerá no Kanban e será persistida no `backend/db.json`

**Se ainda mostrar "Usando dados locais"**: 
- Verificar logs do console (F12)
- Verificar se backend está healthy: `docker-compose ps`
- Ver logs do backend: `docker-compose logs backend`

## 🔍 Troubleshooting

### Problema: Frontend ainda usa localStorage

**Solução**:
```powershell
# Limpar cache do navegador (Ctrl+Shift+Del)
# Ou forçar rebuild sem cache
docker-compose build --no-cache frontend
docker-compose up -d
```

### Problema: Erro CORS

**Solução**: Backend já tem CORS habilitado (`cors()` no `server.js`), mas se necessário:

```javascript
// backend/server.js
server.use(cors({
  origin: '*', // ou 'http://192.168.1.4:3060'
  credentials: true
}));
```

### Problema: Backend não responde

```powershell
# Ver logs
docker-compose logs backend

# Entrar no container
docker exec -it demand-flow-backend sh
# Dentro do container:
node -e "require('http').get('http://localhost:3000/health', r => console.log(r.statusCode))"
```

### Problema: Frontend não rebuilda

```powershell
# Forçar rebuild sem cache
docker-compose down
docker system prune -a --volumes
docker-compose up -d --build
```

## 📊 Fluxo de Dados Correto

```
┌─────────────────┐
│   Navegador     │
│ 192.168.1.4     │
└────────┬────────┘
         │ HTTP Request
         │ GET http://192.168.1.4:3000/api/demandas
         ▼
┌─────────────────┐
│  Frontend       │
│  Container      │
│  (Nginx:80)     │
│  Port: 3060     │
└────────┬────────┘
         │
         │ Auto-detected
         │ via window.location.hostname
         │
         ▼
┌─────────────────┐
│  Backend        │
│  Container      │
│  (JSON-Server)  │
│  Port: 3000     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   db.json       │
│  (Persistent)   │
└─────────────────┘
```

## 🎯 Resultado Esperado

Após aplicar a correção:

✅ Frontend conecta automaticamente ao backend  
✅ Dados persistem em `backend/db.json`  
✅ Mensagem "Usando dados locais" desaparece  
✅ CRUD de demandas funciona via API  
✅ Console mostra: `🔌 API Service initialized with URL: http://192.168.1.4:3000/api`

## 📝 Arquivos Modificados

1. `src/services/api.service.ts` - Auto-detecção de API URL
2. `docker-compose.yml` - Removido VITE_API_URL
3. `docker-compose.dev.yml` - Removido VITE_API_URL

## 🚀 Próximos Passos

Após confirmar que está funcionando:

1. ✅ Testar CRUD completo (Create, Read, Update, Delete)
2. ✅ Verificar persistência após restart dos containers
3. ✅ Testar em diferentes navegadores
4. 📝 Planejar migração para PostgreSQL (quando necessário)

---

**Última atualização**: 2024-11-19  
**Versão**: 2.2.1 (Frontend-Backend Connection Fix)

