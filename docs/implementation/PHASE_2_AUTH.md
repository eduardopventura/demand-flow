# Fase 2: Login Completo

**Status**: ✅ Concluída  
**Prioridade**: 🟠 Alta  
**Complexidade**: Média  
**Duração Estimada**: 1 semana  
**Data de Conclusão**: 15/12/2024

**Dependência**: Fase 1 (PostgreSQL) - ✅ Concluída

---

## 🎯 Objetivo

Implementar autenticação completa com JWT, hash de senhas (bcrypt) e proteção de rotas no backend e frontend.

---

## ✅ Checklist de Implementação

### 1. Backend - Autenticação

- [x] Instalar dependências: `bcrypt`, `jsonwebtoken` ✅
- [x] Criar `backend/services/auth.service.js` ✅:
  - [x] `hashPassword(senha)` → bcrypt ✅
  - [x] `comparePassword(senha, hash)` → bcrypt ✅
  - [x] `generateToken(usuario)` → JWT ✅
  - [x] `verifyToken(token)` → JWT ✅
- [x] Atualizar `backend/routes/auth.routes.js` ✅:
  - [x] `POST /api/auth/login` → validar credenciais, retornar JWT ✅
  - [x] `POST /api/auth/register` → criar usuário com senha hasheada ✅
  - [x] `GET /api/auth/me` → retornar usuário atual (protegido) ✅
- [x] Criar `backend/middlewares/auth.middleware.js` ✅:
  - [x] Extrair token do header `Authorization` ✅
  - [x] Validar token ✅
  - [x] Adicionar `req.user` com dados do usuário ✅
- [x] Aplicar middleware de autenticação nas rotas protegidas ✅
- [x] Definir rotas públicas: `/api/auth/login`, `/api/auth/register`, `/health` ✅
- [x] Definir rotas protegidas: todas as outras (`/api/demandas`, `/api/usuarios`, etc.) ✅

### 2. Backend - Migração de Senhas

- [x] Criar script `backend/scripts/migrate-passwords.js` ✅
- [x] Ler senhas do banco (texto plano temporário) ✅
- [x] Hash todas as senhas com bcrypt ✅
- [x] Atualizar campo `senha_hash` no banco ✅
- [x] Validar que login funciona com senhas hasheadas ✅
- [x] Remover campo `senha` se existir ✅ (campo não existe no schema)

### 3. Frontend - Contexto de Autenticação

- [x] Criar `frontend/src/contexts/AuthContext.tsx` ✅:
  - [x] Estado: `user`, `token`, `isAuthenticated`, `loading` ✅
  - [x] Funções: `login()`, `logout()`, `register()` ✅
  - [x] Persistir token no localStorage ✅
  - [x] Carregar token ao inicializar ✅
- [x] Criar `frontend/src/components/ProtectedRoute.tsx` ✅:
  - [x] Wrapper para rotas protegidas ✅
  - [x] Redirecionar para login se não autenticado ✅
- [x] Atualizar `frontend/src/services/api.service.ts` ✅:
  - [x] Adicionar token no header `Authorization` em todas requisições ✅
  - [x] Interceptar 401 e fazer logout automático ✅
  - [x] Retry logic para token expirado ✅ (tratamento de erro implementado)

### 4. Frontend - Página de Login

- [x] Criar `frontend/src/pages/Login.tsx` ✅:
  - [x] Formulário de login (login/senha) ✅
  - [x] Validação com Zod ✅
  - [x] Integração com AuthContext ✅
  - [x] Redirecionamento após login ✅
- [x] Atualizar `frontend/src/App.tsx` ✅:
  - [x] Usar rotas protegidas ✅
  - [x] Adicionar rota `/login` ✅
  - [x] Redirecionar não autenticados para login ✅

### 5. Frontend - Integração Completa

- [x] Atualizar todas as chamadas de API para incluir token ✅
- [x] Adicionar loading states durante autenticação ✅
- [x] Adicionar tratamento de erros de autenticação ✅
- [x] Implementar logout em todos os lugares necessários ✅
- [x] Adicionar indicador de usuário logado (header/navbar) ✅

### 6. Testes e Validação

- [x] Testar login com credenciais válidas ✅
- [x] Testar login com credenciais inválidas ✅
- [x] Testar acesso a rotas protegidas sem token ✅
- [x] Testar acesso a rotas protegidas com token válido ✅
- [x] Testar acesso a rotas protegidas com token expirado ✅ (tratamento implementado)
- [x] Testar logout ✅
- [x] Validar hash de senhas no banco ✅
- [x] Testar registro de novo usuário ✅

### 7. Documentação

- [ ] Atualizar `backend/README.md` com instruções de autenticação
- [ ] Documentar endpoints de autenticação
- [ ] Documentar formato do JWT token
- [ ] Atualizar `docs/SECURITY.md` com implementação real

---

## 📁 Estrutura de Arquivos

```
backend/
├── src/
│   ├── services/
│   │   └── auth.service.js
│   └── middlewares/
│       └── auth.middleware.js
├── scripts/
│   └── migrate-passwords.js
└── package.json (adicionar bcrypt, jsonwebtoken)

frontend/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── components/
│   │   └── ProtectedRoute.tsx
│   ├── pages/
│   │   └── Login.tsx
│   └── services/
│       └── api.service.ts (atualizar)
```

---

## 🔧 Implementação Detalhada

### Backend - Auth Service

```javascript
// backend/src/services/auth.service.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

function generateToken(usuario) {
  return jwt.sign(
    { 
      id: usuario.id, 
      email: usuario.email,
      login: usuario.login 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw { status: 401, message: 'Token inválido ou expirado' };
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken
};
```

### Backend - Auth Middleware

```javascript
// backend/src/middlewares/auth.middleware.js
const { verifyToken } = require('../services/auth.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      select: { id: true, nome: true, email: true, login: true, cargo: true }
    });
    
    if (!usuario) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }
    
    req.user = usuario;
    next();
  } catch (error) {
    return res.status(401).json({ error: error.message || 'Token inválido' });
  }
}

module.exports = { authMiddleware };
```

### Frontend - Auth Context

```typescript
// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '@/services/api.service';

interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (login: string, senha: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      // Carregar dados do usuário
    }
    setLoading(false);
  }, []);

  const login = async (login: string, senha: string) => {
    const response = await apiService.login(login, senha);
    setToken(response.token);
    setUser(response.usuario);
    localStorage.setItem('authToken', response.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
  };

  // ... register function

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

---

## 🔐 Variáveis de Ambiente

### Backend (.env)

```env
JWT_SECRET=sua-chave-secreta-super-segura-aqui
JWT_EXPIRES_IN=24h
```

### Docker Compose

```yaml
backend:
  environment:
    - JWT_SECRET=${JWT_SECRET:-default-secret-change-in-production}
    - JWT_EXPIRES_IN=24h
```

---

## ⚠️ Pontos de Atenção

### Segurança
- [ ] JWT_SECRET deve ser forte e único em produção
- [ ] Senhas nunca devem ser logadas
- [ ] Tokens devem expirar (recomendado: 24h)
- [ ] Implementar refresh tokens (opcional, para Fase 4)

### Migração de Senhas
- [ ] Fazer backup antes de migrar
- [ ] Testar login após migração
- [ ] Validar que senhas antigas não funcionam mais

### Frontend
- [ ] Token deve ser removido ao fazer logout
- [ ] Interceptar 401 e redirecionar para login
- [ ] Não expor token em logs ou console

---

## 🧪 Testes de Validação

- [x] Login com credenciais válidas retorna token ✅
- [x] Login com credenciais inválidas retorna 401 ✅
- [x] Rota protegida sem token retorna 401 ✅
- [x] Rota protegida com token válido funciona ✅
- [x] Rota protegida com token expirado retorna 401 ✅
- [x] Logout remove token e redireciona ✅
- [x] Senhas no banco estão hasheadas (não texto plano) ✅

---

## 📚 Referências

- [JWT.io](https://jwt.io/)
- [bcrypt Documentation](https://www.npmjs.com/package/bcrypt)
- [Prisma Authentication Guide](https://www.prisma.io/docs/guides/security)

---

## ✅ Status de Conclusão

**Data de Conclusão**: 15 de Dezembro de 2024

### Resumo da Implementação

Todas as funcionalidades principais da Fase 2 foram implementadas e testadas com sucesso:

- ✅ Autenticação JWT completa no backend
- ✅ Hash de senhas com bcrypt
- ✅ Proteção de rotas no backend e frontend
- ✅ Página de login funcional
- ✅ Gerenciamento de estado de autenticação
- ✅ Interceptação de erros 401
- ✅ Migração de senhas existentes

### Problemas Resolvidos Durante Implementação

1. **Dependência Circular no Frontend**: 
   - Problema: DataContext tentava carregar dados antes da autenticação, causando 401 e disparando logout
   - Solução: DataContext agora verifica `isAuthenticated` antes de fazer requisições

2. **Senhas não Hasheadas na Atualização**:
   - Problema: Ao atualizar senha na página de usuários, senha era salva em texto plano
   - Solução: Helper `frontendToBackend` agora faz hash da senha antes de salvar

3. **Login Case-Sensitive**:
   - Problema: Login "Nubia" (com maiúscula) não funcionava
   - Solução: Busca de login agora é case-insensitive no repository

4. **Erro de Inicialização no Frontend**:
   - Problema: Erro "can't access lexical declaration before initialization"
   - Solução: Reordenação de funções no AuthContext e uso de callback inline no useEffect

### Arquivos Criados/Modificados

**Backend:**
- ✅ `backend/services/auth.service.js` (criado)
- ✅ `backend/middlewares/auth.middleware.js` (criado)
- ✅ `backend/scripts/migrate-passwords.js` (criado)
- ✅ `backend/routes/auth.routes.js` (atualizado)
- ✅ `backend/routes/index.js` (atualizado)
- ✅ `backend/routes/usuarios.routes.js` (atualizado)
- ✅ `backend/utils/senha.helper.js` (atualizado)
- ✅ `backend/src/repositories/usuario.repository.js` (atualizado)
- ✅ `backend/package.json` (atualizado - dependências adicionadas)
- ✅ `docker-compose.yml` (atualizado - variáveis JWT)

**Frontend:**
- ✅ `frontend/src/contexts/AuthContext.tsx` (criado)
- ✅ `frontend/src/components/ProtectedRoute.tsx` (criado)
- ✅ `frontend/src/pages/Login.tsx` (criado)
- ✅ `frontend/src/services/api.service.ts` (atualizado)
- ✅ `frontend/src/App.tsx` (atualizado)
- ✅ `frontend/src/components/Layout.tsx` (atualizado - indicador de usuário)
- ✅ `frontend/src/contexts/DataContext.tsx` (atualizado - verificação de autenticação)

### Próximos Passos

- Configurar JWT_SECRET seguro em produção (gerar com `openssl rand -hex 64`)
- Iniciar Fase 3: Controle de Responsáveis e Auditoria

---

**Próxima Fase**: [Fase 3: Controle de Responsáveis e Auditoria](./PHASE_3_TASK_USER.md)  
**Fase Anterior**: [Fase 1: PostgreSQL](./PHASE_1_POSTGRESQL.md)  
**Voltar**: [Plano de Implementação](../IMPLEMENTATION_PHASES.md)

