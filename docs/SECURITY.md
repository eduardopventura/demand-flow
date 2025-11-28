# Notas de Segurança

## ⚠️ Avisos Importantes

### Armazenamento de Senhas

**Status Atual:** ❌ INSEGURO PARA PRODUÇÃO

O projeto atualmente armazena senhas em **texto plano** no localStorage do navegador. Esta é uma implementação **APENAS para desenvolvimento/protótipo**.

### Riscos

1. **localStorage é acessível via JavaScript**
   - Qualquer script pode ler os dados
   - Vulnerável a XSS (Cross-Site Scripting)

2. **Senhas em texto plano**
   - Sem hash ou criptografia
   - Facilmente comprometidas

3. **Dados persistentes no navegador**
   - Permanecem após logout
   - Acessíveis por outras extensões/malware

### ✅ Soluções para Produção

#### Opção 1: Backend com Autenticação Completa (Recomendado)

```typescript
// Backend (Node.js + Express)
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Registro de usuário
app.post('/api/auth/register', async (req, res) => {
  const { email, senha } = req.body;
  
  // Hash da senha com bcrypt
  const hashedPassword = await bcrypt.hash(senha, 10);
  
  // Salvar no banco de dados
  await db.usuarios.create({
    email,
    senha: hashedPassword, // Nunca salvar texto plano!
  });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, senha } = req.body;
  
  const usuario = await db.usuarios.findOne({ email });
  
  // Comparar senha hash
  const senhaValida = await bcrypt.compare(senha, usuario.senha);
  
  if (!senhaValida) {
    return res.status(401).json({ error: 'Senha inválida' });
  }
  
  // Gerar JWT token
  const token = jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  res.json({ token });
});
```

```typescript
// Frontend
// Salvar apenas o token JWT
localStorage.setItem('authToken', token);

// Incluir em requests
fetch('/api/demandas', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

#### Opção 2: Serviços de Autenticação (Mais Rápido)

Use provedores de autenticação prontos:

1. **Firebase Authentication**
   - Google, Facebook, Email/Password
   - Gerenciamento de usuários
   - Gratuito até 10k usuários

2. **Auth0**
   - Enterprise-grade
   - Social logins
   - MFA (Multi-Factor Authentication)

3. **Supabase**
   - Open-source
   - PostgreSQL integrado
   - Row Level Security

4. **Clerk**
   - UI components prontos
   - Webhooks
   - Organizations/Teams

#### Opção 3: Mínimo Viável (Ainda não ideal)

Se você **absolutamente precisa** manter localStorage:

```typescript
// Usar Web Crypto API para hash básico
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// AINDA ASSIM: vulnerável a XSS!
// Não recomendado para dados sensíveis reais
```

### 🛡️ Melhores Práticas de Segurança

#### 1. Nunca Confie em Dados do Cliente
```typescript
// ❌ Ruim
if (usuario.role === 'admin') {
  // Qualquer um pode modificar isso no localStorage
}

// ✅ Bom
// Validar no backend
const response = await fetch('/api/admin/action', {
  headers: { Authorization: `Bearer ${token}` }
});
```

#### 2. Validação de Entrada
```typescript
// Usar Zod para validar SEMPRE
const result = usuarioSchema.safeParse(data);
if (!result.success) {
  // Rejeitar dados inválidos
}
```

#### 3. HTTPS Obrigatório
```nginx
# Nginx config
server {
  listen 443 ssl http2;
  
  # Forçar HTTPS
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

#### 4. Content Security Policy
```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'">
```

#### 5. Sanitização de Inputs
```typescript
import DOMPurify from 'dompurify';

// Limpar HTML user-generated
const cleanHTML = DOMPurify.sanitize(dirtyHTML);
```

### 📊 Comparação de Abordagens

| Abordagem | Segurança | Complexidade | Custo | Tempo |
|-----------|-----------|--------------|-------|-------|
| **LocalStorage (atual)** | ❌ Muito Baixa | ✅ Baixa | ✅ Zero | ✅ Rápido |
| **Backend próprio** | ✅ Alta | ⚠️ Alta | ⚠️ Médio | ⚠️ Lento |
| **Firebase/Auth0** | ✅ Muito Alta | ✅ Baixa | ✅ Grátis/Baixo | ✅ Rápido |
| **Supabase** | ✅ Alta | ✅ Média | ✅ Grátis/Baixo | ✅ Médio |

### 🚀 Recomendação para Este Projeto

**Para MVP/Demo:** 
- Manter implementação atual
- Adicionar aviso visível de "ambiente de desenvolvimento"
- Dados de teste apenas

**Para Produção:**
- **Curto prazo:** Implementar Firebase Authentication
- **Médio prazo:** Backend Node.js + PostgreSQL + JWT
- **Longo prazo:** Microserviços com OAuth2

### Exemplo: Migração para Firebase

```bash
npm install firebase
```

```typescript
// src/services/auth.service.ts
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword 
} from 'firebase/auth';

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  // ...
});

const auth = getAuth(app);

export const authService = {
  async login(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(
      auth, 
      email, 
      password
    );
    return userCredential.user;
  },
  
  async register(email: string, password: string) {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  },
  
  async logout() {
    await auth.signOut();
  }
};
```

### 📝 Checklist de Segurança

Antes de ir para produção, garantir:

- [ ] Autenticação implementada com backend
- [ ] Senhas hasheadas com bcrypt/argon2
- [ ] HTTPS configurado
- [ ] Tokens JWT com expiração
- [ ] Refresh tokens implementados
- [ ] Rate limiting no backend
- [ ] CORS configurado corretamente
- [ ] Input validation no frontend E backend
- [ ] Logs de segurança
- [ ] Monitoramento de tentativas de login
- [ ] 2FA/MFA para admins
- [ ] Política de senhas fortes
- [ ] Backup e recovery plan

### 🆘 Em Caso de Breach

Se houver comprometimento de dados:

1. **Isolar o sistema** imediatamente
2. **Invalidar todos os tokens** ativos
3. **Forçar reset de senhas**
4. **Notificar usuários** afetados
5. **Investigar** como ocorreu
6. **Documentar** e aprender
7. **Melhorar** segurança

### 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Web Security Checklist](https://github.com/OWASP/wstg)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

---

**Lembre-se:** Segurança não é uma feature, é um requisito! 🔒

