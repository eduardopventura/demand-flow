# ⚙️ Configuração - Demand Flow MVP

## 🎯 Filosofia de Configuração

**Abordagem Pragmática para Projetos Pequenos/MVP:**

1. ✅ **IP Hardcoded** - Projeto não prevê rodar em múltiplos ambientes
2. ✅ **Fallback localStorage** - Funciona offline automaticamente
3. ✅ **Sem separação dev/prod** - Complexidade desnecessária para MVP
4. ✅ **Docker-compose.dev apenas para testes paralelos** - Mesmas configs, portas diferentes

---

## 🌐 Configuração da API

### Padrão (Hardcoded)

**Arquivo**: `src/services/api.service.ts`

```typescript
const API_URL = "http://192.168.1.4:3000/api";
```

### Para Mudar o IP/Porta

**Opção 1: Editar o código (Recomendado para MVP)**

```typescript
// src/services/api.service.ts
const API_URL = "http://SEU-NOVO-IP:3000/api";
```

Depois rebuild:
```bash
docker-compose down
docker-compose up -d --build
```

**Opção 2: Variável de Ambiente (Opcional)**

Crie arquivo `.env` na raiz:
```env
VITE_API_URL=http://192.168.1.100:3000/api
```

Depois rebuild:
```bash
docker-compose down
docker-compose up -d --build
```

---

## 🐳 Docker - Produção vs Dev

### Produção (Padrão)

```bash
# Porta 3000 (backend) e 3060 (frontend)
docker-compose up -d
```

**URLs**:
- Frontend: `http://192.168.1.4:3060`
- Backend: `http://192.168.1.4:3000`

### Desenvolvimento (Paralelo)

```bash
# Porta 3001 (backend) e 3061 (frontend)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

**URLs**:
- Frontend DEV: `http://192.168.1.4:3061`
- Backend DEV: `http://192.168.1.4:3001`
- Database DEV: `backend/db-dev.json` (separado da produção)

**Por que usar ambiente dev?**
- Testar mudanças sem afetar produção
- Database separado (não corrompe dados de produção)
- Roda em paralelo (prod e dev ao mesmo tempo)
- **Configurações idênticas** (alta fidelidade)

---

## 📁 Arquivos de Dados

### Produção
```
backend/db.json
```

### Desenvolvimento
```
backend/db-dev.json
```

**Criar db-dev.json**:
```bash
# Copiar estrutura da produção
cp backend/db.json backend/db-dev.json

# Ou usar seed
cd backend && npm run seed
```

---

## 🔄 Fallback localStorage

**Funcionamento Automático:**

1. Frontend tenta conectar na API (`http://192.168.1.4:3000/api`)
2. **Se sucesso**: Usa dados da API ✅
3. **Se falha**: Usa localStorage automaticamente 🔄
4. **Toast notification**: "Erro ao carregar dados. Backend pode estar offline."

**Não requer configuração!** Já está implementado no `DataContext`.

---

## 🛠️ Casos de Uso

### Caso 1: Mudar IP do Servidor

**Cenário**: Servidor mudou de `192.168.1.4` para `192.168.1.100`

**Solução**:
```typescript
// src/services/api.service.ts
const API_URL = "http://192.168.1.100:3000/api";
```

```bash
docker-compose down
docker-compose up -d --build
```

### Caso 2: Testar Localmente sem Docker

**Cenário**: Rodar frontend e backend localmente

**Backend**:
```bash
cd backend
npm install
npm start
# Roda em localhost:3000
```

**Frontend**:
```bash
npm install
npm run dev
# Roda em localhost:8080
```

**Configuração**:
```typescript
// src/services/api.service.ts
const API_URL = "http://localhost:3000/api";
```

### Caso 3: Ambiente Dev Paralelo

**Cenário**: Testar mudanças sem afetar produção

**Subir produção**:
```bash
docker-compose up -d
# Frontend: :3060, Backend: :3000
```

**Subir dev em paralelo**:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
# Frontend: :3061, Backend: :3001
```

**Configuração**: 
- Prod usa `db.json`
- Dev usa `db-dev.json`
- Redes separadas

### Caso 4: Backend Offline

**Cenário**: Backend não está rodando

**Comportamento**:
1. Frontend carrega normalmente
2. Tenta conectar na API
3. Falha silenciosamente
4. Usa localStorage (dados locais)
5. Toast: "Usando dados locais. Verifique se o backend está rodando."

**Não requer ação!** Sistema funciona offline automaticamente.

---

## 🔐 Considerações de Segurança

### Para MVP (Atual)
✅ Adequado para uso interno/rede local

### Para Produção Externa
❌ IP hardcoded não é recomendado
✅ Use variáveis de ambiente
✅ Configure HTTPS
✅ Use domínio (não IP)

**Migração para produção**: Ver `SECURITY.md`

---

## 📊 Estrutura de Configuração

```
demand-flow/
├── .env (opcional - gitignored)
├── CONFIG.md (este arquivo)
├── docker-compose.yml (produção - porta 3000/3060)
├── docker-compose.dev.yml (dev - porta 3001/3061)
├── src/
│   └── services/
│       └── api.service.ts (IP hardcoded aqui)
├── backend/
│   ├── db.json (produção)
│   └── db-dev.json (desenvolvimento)
```

---

## ✅ Checklist de Configuração

### Setup Inicial
- [ ] Verificar IP do servidor: `ipconfig` (Windows) ou `ip addr` (Linux)
- [ ] Atualizar `api.service.ts` com IP correto
- [ ] Subir containers: `docker-compose up -d`
- [ ] Testar: `http://SEU-IP:3060`
- [ ] Verificar console: "API Service initialized"

### Setup Ambiente Dev (Opcional)
- [ ] Copiar `db.json` para `db-dev.json`
- [ ] Subir dev: `docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d`
- [ ] Testar: `http://SEU-IP:3061`
- [ ] Verificar que prod e dev rodam juntos

### Troubleshooting
- [ ] Backend responde: `curl http://SEU-IP:3000/health`
- [ ] Frontend carrega: Abrir no navegador
- [ ] Console sem erros: F12 → Console
- [ ] Dados persistem: Criar demanda → Reload → Ainda está lá

---

## 🎯 TL;DR - Mudanças Rápidas

### Mudar IP
```typescript
// src/services/api.service.ts linha ~17
const API_URL = "http://NOVO-IP:3000/api";
```

### Rebuild
```bash
docker-compose down && docker-compose up -d --build
```

### Testar
```
http://SEU-IP:3060
```

---

**Filosofia**: Simples, direto, sem complexidade desnecessária para MVP.

**Última atualização**: 2025-11-19 v2.3.0

