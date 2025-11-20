# 🔧 Force Rebuild - Correção v2.2.2

## 🐛 Problema Identificado

O frontend ainda estava usando `localhost:3000` ao invés de `192.168.1.4:3000` porque:

1. **Lógica dependia de `import.meta.env.PROD`** - Variável não estava configurada corretamente
2. **Cache do build anterior** - Docker manteve imagem antiga
3. **Modo dev sendo usado** - Build não estava em produção

## ✅ Solução Aplicada (v2.2.2)

### Nova lógica simplificada:
```typescript
// Se hostname é localhost/127.0.0.1 → usa localhost:3000
// Caso contrário → usa {hostname}:3000

const hostname = window.location.hostname;
if (hostname === 'localhost' || hostname === '127.0.0.1') {
  return "http://localhost:3000/api";
}
return `http://${hostname}:3000/api`;
```

**Vantagens**:
- ✅ Não depende de variáveis de ambiente
- ✅ Usa apenas `window.location.hostname` (sempre disponível)
- ✅ Funciona em qualquer cenário (dev, prod, Docker, network)
- ✅ Logs de debug para troubleshooting

## 🚀 Como Aplicar (FORCE REBUILD)

Execute no **PowerShell/CMD** (não no WSL):

```powershell
cd V:\demand-flow

# 1. Parar tudo
docker-compose down

# 2. LIMPAR CACHE E IMAGENS
docker-compose down --rmi all --volumes --remove-orphans

# 3. Limpar build cache (opcional mas recomendado)
docker system prune -f

# 4. Rebuild SEM CACHE
docker-compose build --no-cache

# 5. Subir serviços
docker-compose up -d

# 6. Ver logs em tempo real
docker-compose logs -f
```

### Alternativa rápida (apenas frontend):
```powershell
cd V:\demand-flow

# Parar frontend
docker-compose stop frontend

# Remover container e imagem
docker rm demand-flow-frontend
docker rmi demand-flow-frontend

# Rebuild sem cache
docker-compose build --no-cache frontend

# Subir tudo
docker-compose up -d

# Ver logs
docker-compose logs -f frontend
```

## 🧪 Verificar se Funcionou

### 1. Console do navegador (F12)

**Deve mostrar**:
```
🌐 Network/Docker access detected (192.168.1.4)
🔌 API Service initialized with URL: http://192.168.1.4:3000/api
```

**NÃO deve mostrar**:
```
❌ http://localhost:3000
❌ Usando dados locais
```

### 2. Teste rápido
```bash
# Testar backend
curl http://192.168.1.4:3000/health

# Deve retornar:
# {"status":"healthy","timestamp":"...","version":"1.0.0","database":"json-server"}
```

### 3. Teste de persistência
1. Criar uma demanda
2. F12 → Network → Ver requisição POST para `http://192.168.1.4:3000/api/demandas`
3. Recarregar página (F5)
4. Demanda ainda está lá = ✅ FUNCIONOU!

## 🔍 Troubleshooting

### Ainda mostra localhost no console

**Causa**: Build não foi refeito, cache antigo

**Solução**:
```powershell
# Força limpeza completa
docker-compose down --rmi all
docker builder prune -a -f
docker-compose build --no-cache
docker-compose up -d
```

### Erro ERR_CONNECTION_REFUSED

**Causa**: Backend não está rodando ou não é acessível

**Verificar**:
```powershell
# Status dos containers
docker-compose ps

# Logs do backend
docker-compose logs backend

# Testar backend diretamente
curl http://192.168.1.4:3000/health
```

**Solução**:
```powershell
# Restart apenas do backend
docker-compose restart backend

# Ou rebuild completo
docker-compose down
docker-compose up -d --build
```

### Frontend mostra "dados locais"

**Causa**: API não está respondendo

**Verificar**:
1. Backend está healthy: `docker-compose ps`
2. Health check funciona: `curl http://192.168.1.4:3000/health`
3. Porta 3000 está aberta: `netstat -an | findstr :3000`

### Portas já em uso

**Solução**: Editar `docker-compose.yml`
```yaml
services:
  frontend:
    ports:
      - "3061:80"  # Mudar de 3060 para 3061
  backend:
    ports:
      - "3001:3000"  # Mudar de 3000 para 3001
```

Então atualizar `api.service.ts`:
```typescript
return `http://${hostname}:3001/api`;  // Mudar porta
```

## 📊 O Que Mudou

| Versão | Lógica | Problema |
|--------|--------|----------|
| v2.2.0 | Hardcoded `localhost` | Não funcionava no Docker |
| v2.2.1 | Usava `import.meta.env.PROD` | Depende de variável de ambiente |
| **v2.2.2** | **Usa `window.location.hostname`** | ✅ **Funciona sempre** |

## ✅ Resultado Esperado

Após o force rebuild:

```
Browser URL: http://192.168.1.4:3060
Console Log: 🌐 Network/Docker access detected (192.168.1.4)
Console Log: 🔌 API Service initialized with URL: http://192.168.1.4:3000/api
Network Tab: Requisições para http://192.168.1.4:3000/api/*
Backend:     db.json atualizado com dados
```

## 🎯 Checklist Final

- [ ] Executei `docker-compose down --rmi all`
- [ ] Executei `docker-compose build --no-cache`
- [ ] Executei `docker-compose up -d`
- [ ] Aguardei containers ficarem healthy
- [ ] Abri `http://192.168.1.4:3060`
- [ ] Console mostra: `Network/Docker access detected`
- [ ] Console mostra: `http://192.168.1.4:3000/api`
- [ ] Não vejo "Usando dados locais"
- [ ] Criei demanda de teste
- [ ] Demanda persiste após reload
- [ ] ✅ **FUNCIONOU 100%!**

---

**Última atualização**: 2025-11-19 v2.2.2  
**Status**: Lógica simplificada, não depende de env vars
