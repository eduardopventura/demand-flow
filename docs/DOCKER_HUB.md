# Docker Hub - Build Local e Desenvolvimento

Este documento descreve como fazer build das imagens Docker localmente e como configurar o ambiente de desenvolvimento.

## Build Local das Imagens

### Backend

```bash
# Build da imagem backend
docker build -t edpv/demand-flow-backend:latest -t edpv/demand-flow-backend:v1.0.0 ./backend

# Testar a imagem localmente
docker run --rm -p 3000:3000 edpv/demand-flow-backend:latest
```

### Frontend

```bash
# Build da imagem frontend
docker build -t edpv/demand-flow-frontend:latest -t edpv/demand-flow-frontend:v1.0.0 ./frontend

# Testar a imagem localmente
docker run --rm -p 3060:80 edpv/demand-flow-frontend:latest
```

### Build Ambas as Imagens

```bash
# Build backend e frontend
docker build -t edpv/demand-flow-backend:latest -t edpv/demand-flow-backend:v1.0.0 ./backend
docker build -t edpv/demand-flow-frontend:latest -t edpv/demand-flow-frontend:v1.0.0 ./frontend
```

## Testar Imagens Localmente

Após fazer o build, você pode testar as imagens usando o `docker-compose.yml` modificado temporariamente para usar as imagens locais:

```yaml
# Temporariamente, altere no docker-compose.yml:
backend:
  image: edpv/demand-flow-backend:latest
  # ou use build: se preferir

frontend:
  image: edpv/demand-flow-frontend:latest
  # ou use build: se preferir
```

## Desenvolvimento Local

Para desenvolvimento com build local, você pode usar o `docker-compose-dev.yml` ou fazer build das imagens manualmente.

### Opção 1: Usando docker-compose-dev.yml

Se você tem um arquivo `docker-compose-dev.yml` configurado:

```bash
git clone <seu-repo>
cd demand-flow
docker-compose -f docker-compose-dev.yml up -d --build
```

### Opção 2: Build Manual das Imagens

1. **Build das imagens localmente:**

```bash
# Build backend
docker build -t edpv/demand-flow-backend:latest -t edpv/demand-flow-backend:v1.0.0 ./backend

# Build frontend
docker build -t edpv/demand-flow-frontend:latest -t edpv/demand-flow-frontend:v1.0.0 ./frontend
```

2. **Modificar docker-compose.yml temporariamente:**

Altere o `docker-compose.yml` para usar as imagens locais ao invés de buscar do Docker Hub:

```yaml
backend:
  image: edpv/demand-flow-backend:latest
  # Remova ou comente: build: ./backend

frontend:
  image: edpv/demand-flow-frontend:latest
  # Remova ou comente: build: ./frontend
```

3. **Subir os containers:**

```bash
docker-compose up -d
```

### Opção 3: Desenvolvimento com Hot Reload

Para desenvolvimento com hot reload, você pode montar volumes com o código fonte:

```yaml
# docker-compose-dev.yml (exemplo)
services:
  backend:
    build: ./backend
    volumes:
      - ./backend:/app
      - /app/node_modules
    command: npm run dev

  frontend:
    build: ./frontend
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev
```

### Variáveis de Ambiente para Desenvolvimento

Crie um arquivo `backend/.env` com as variáveis necessárias:

```env
# Banco de dados
DATABASE_URL=postgresql://demandflow:demandflow_password@postgres:5432/demandflow

# JWT
JWT_SECRET=seu_jwt_secret_aqui
JWT_EXPIRES_IN=24h

# SMTP (opcional)
SMTP_USER=seu_email@exemplo.com
SMTP_PASS=sua_senha_de_app

# WhatsApp (opcional)
WHATSAPP_WEBHOOK_URL=https://seu-webhook.com
```

### Executar Migrations em Desenvolvimento

```bash
# Entrar no container do backend
docker exec -it demand-flow-backend sh

# Executar migrations
npm run prisma:migrate:dev

# Gerar Prisma Client
npx prisma generate
```

### Ver Logs em Desenvolvimento

```bash
# Logs do backend
docker-compose logs -f backend

# Logs do frontend
docker-compose logs -f frontend

# Logs de todos os serviços
docker-compose logs -f
```

---

## Notas

- As imagens são construídas com tags `latest` e `v1.0.0`
- Para outras informações sobre publicação no Docker Hub, consulte `DOCKER_HUB_TEMP.md` na raiz do projeto
- Em desenvolvimento, considere usar volumes para hot reload
- Sempre execute migrations após mudanças no schema Prisma

