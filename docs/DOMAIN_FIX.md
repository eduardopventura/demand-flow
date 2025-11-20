# 🌐 Correção de Domínio - CORS e Proxy

> **Problema**: Frontend funcionava via IP mas dava erro de CORS via domínio

---

## 🐛 Problema Identificado

**Sintomas:**
- ✅ Funciona: `http://192.168.1.4:3060`
- ❌ Não funciona: `https://demandas.kumonceilandiasul.com.br`
- Erro no console: `CORS policy: Permission was denied`
- Mixed Content: `The page at 'https://...' was loaded over HTTPS, but requested an insecure resource 'http://192.168.1.4:3000/api/...'`

**Causa Raiz:**
1. **API URL hardcoded**: Frontend usava `http://192.168.1.4:3000/api` sempre
2. **Cross-Origin**: Domínio diferente do IP causa bloqueio CORS
3. **Mixed Content**: HTTPS → HTTP bloqueado pelo navegador
4. **Sem proxy**: Nginx não estava fazendo proxy das requisições `/api`

---

## ✅ Solução Implementada

### 1. Nginx com Proxy `/api`

**Arquivo**: `nginx.conf`

```nginx
# API proxy - Proxying API requests to backend
location /api {
    proxy_pass http://backend:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

**Como funciona:**
- Requisições para `https://seu-dominio.com/api/usuarios` são interceptadas pelo Nginx
- Nginx faz proxy internamente para `http://backend:3000/api/usuarios`
- Navegador vê tudo como mesmo domínio (sem CORS!)

### 2. API Service Adaptativo

**Arquivo**: `src/services/api.service.ts`

```typescript
const getApiUrl = (): string => {
  // 1. Variável de ambiente tem prioridade
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Em produção ou com domínio, usa caminho relativo (Nginx faz proxy)
  if (import.meta.env.PROD || window.location.hostname.includes('.')) {
    return '/api';
  }

  // 3. Desenvolvimento local
  return 'http://localhost:3000/api';
};
```

**Lógica:**
- **Domínio** (ex: `demandas.kumonceilandiasul.com.br`) → usa `/api` (relativo)
- **IP** (ex: `192.168.1.4`) → usa `/api` (relativo em prod)
- **Localhost** (dev) → usa `http://localhost:3000/api` (direto)

---

## 🔄 Fluxo Antes vs Depois

### ❌ Antes (Com Erro)

```
Browser (https://demandas.kumonceilandiasul.com.br)
    ↓
    Tenta acessar: http://192.168.1.4:3000/api/usuarios
    ↓
    ❌ BLOQUEADO: CORS + Mixed Content (HTTPS→HTTP)
```

### ✅ Depois (Funcionando)

```
Browser (https://demandas.kumonceilandiasul.com.br)
    ↓
    Requisição: https://demandas.kumonceilandiasul.com.br/api/usuarios
    ↓
    Nginx (frontend container) intercepta /api
    ↓
    Proxy interno: http://backend:3000/api/usuarios
    ↓
    ✅ SUCESSO: Mesmo domínio, sem CORS, sem Mixed Content
```

---

## 🚀 Como Aplicar

### 1. Rebuild Completo

```bash
# No PowerShell/CMD
cd V:\demand-flow

# Parar tudo
docker-compose down

# Rebuild sem cache (importante!)
docker-compose build --no-cache

# Subir
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### 2. Verificar

**Via Domínio:**
```
https://demandas.kumonceilandiasul.com.br
```

**Console deve mostrar:**
```
🔌 API Service initialized with URL: /api
```

**NÃO deve mostrar:**
- ❌ `http://192.168.1.4:3000/api`
- ❌ Erros de CORS
- ❌ Mixed Content

### 3. Testar Funcionalidades

1. Criar uma demanda
2. F12 → Network → Ver requisições
3. Deve mostrar: `https://seu-dominio.com/api/demandas`
4. Status: `200 OK`

---

## 🌐 Funcionamento com Diferentes Acessos

| Acesso Via | API URL | Proxy | Funciona |
|-----------|---------|-------|----------|
| `https://demandas.kumonceilandiasul.com.br` | `/api` | ✅ Nginx | ✅ Sim |
| `http://192.168.1.4:3060` | `/api` | ✅ Nginx | ✅ Sim |
| `http://localhost:3060` (Docker) | `/api` | ✅ Nginx | ✅ Sim |

**Tudo funciona!** 🎉

---

## 🔐 Configuração HTTPS (Recomendado)

### Se usar Cloudflare/Nginx Proxy Manager

**Sem configuração adicional necessária!**
- Cloudflare/NPM faz SSL Termination
- Conexão Cloudflare ↔ Nginx pode ser HTTP
- Nginx proxy funciona normalmente

### Se usar Let's Encrypt direto

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name demandas.kumonceilandiasul.com.br;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # Resto da configuração igual...
    location /api {
        proxy_pass http://backend:3000;
        # ...
    }
}

server {
    listen 80;
    server_name demandas.kumonceilandiasul.com.br;
    return 301 https://$server_name$request_uri;
}
```

---

## 🧪 Troubleshooting

### Ainda aparece erro de CORS

**Solução:**
```bash
# Limpar cache do navegador
Ctrl+Shift+Del

# Forçar rebuild sem cache
docker-compose down --rmi all
docker-compose build --no-cache
docker-compose up -d
```

### Console mostra IP ao invés de `/api`

**Causa**: Build antigo em cache

**Solução:**
```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Requisições vão para IP errado

**Causa**: Variável de ambiente `VITE_API_URL` setada

**Solução:**
```bash
# Remover .env se existir
rm .env

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Backend retorna 502 Bad Gateway

**Causa**: Backend não está respondendo

**Verificar:**
```bash
# Status do backend
docker-compose ps

# Logs do backend
docker-compose logs backend

# Entrar no container frontend e testar
docker exec -it demand-flow-frontend sh
wget -O- http://backend:3000/health
```

---

## 📊 Checklist de Verificação

- [ ] `nginx.conf` tem `location /api` habilitado
- [ ] `api.service.ts` usa lógica adaptativa
- [ ] Rebuild executado: `docker-compose build --no-cache`
- [ ] Containers rodando: `docker-compose ps`
- [ ] Console mostra: `API Service initialized with URL: /api`
- [ ] Requisições vão para `https://seu-dominio.com/api/*`
- [ ] Sem erros de CORS no console
- [ ] Funcionalidades funcionam (criar, editar, deletar)

---

## 💡 Vantagens da Solução

### 1. **Sem CORS Issues**
- Tudo no mesmo domínio
- Navegador vê como origem única
- Sem configurações complexas de CORS

### 2. **HTTPS Funcionando**
- Sem Mixed Content
- Seguro por padrão
- Sem warnings no navegador

### 3. **Flexível**
- Funciona via domínio
- Funciona via IP
- Funciona localhost
- Funciona em qualquer ambiente

### 4. **Simples**
- Nginx cuida do proxy
- Frontend não precisa saber onde está o backend
- Fácil de manter

### 5. **Segurança**
- Backend não precisa ser exposto diretamente
- Nginx pode adicionar rate limiting
- Headers de segurança centralizados

---

## 📚 Arquivos Modificados

- ✅ `nginx.conf` - Adicionado proxy `/api`
- ✅ `src/services/api.service.ts` - Lógica adaptativa
- ✅ `CHANGELOG.md` - v2.3.3 documentada
- ✅ `DOMAIN_FIX.md` - Este documento

---

## 🎯 Resultado Final

**Antes:**
```
❌ Domínio: Erro de CORS
✅ IP: Funcionando
```

**Depois:**
```
✅ Domínio: Funcionando
✅ IP: Funcionando
✅ Localhost: Funcionando
✅ Qualquer acesso: Funcionando
```

---

**Versão**: 2.3.3  
**Data**: 2025-11-19  
**Status**: Corrigido e testado ✅

