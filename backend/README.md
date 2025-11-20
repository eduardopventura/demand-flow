# Backend - Demand Flow

## 📦 JSON-Server MVP

Backend simples e eficiente usando JSON-Server para MVP.

---

## 🚀 Quick Start

### Local (sem Docker)

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start

# Ou desenvolvimento (com hot reload)
npm run dev

# Resetar database
npm run seed
```

### Com Docker

```bash
# Da raiz do projeto
docker-compose up backend -d

# Ver logs
docker-compose logs -f backend
```

---

## 📁 Estrutura

```
backend/
├── server.js          # Servidor API
├── db.json            # Database (persistente)
├── package.json       # Dependencies
├── Dockerfile         # Docker image
└── scripts/
    └── seed.js        # Reset database
```

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Recursos

**Usuários**
- `GET /api/usuarios` - Listar todos
- `GET /api/usuarios/:id` - Buscar por ID
- `POST /api/usuarios` - Criar novo
- `PATCH /api/usuarios/:id` - Atualizar
- `PUT /api/usuarios/:id` - Substituir
- `DELETE /api/usuarios/:id` - Deletar

**Templates**
- `GET /api/templates`
- `GET /api/templates/:id`
- `POST /api/templates`
- `PATCH /api/templates/:id`
- `DELETE /api/templates/:id`

**Demandas**
- `GET /api/demandas`
- `GET /api/demandas/:id`
- `POST /api/demandas`
- `PATCH /api/demandas/:id`
- `DELETE /api/demandas/:id`

### Filtros e Query

JSON-Server suporta queries avançadas:

```bash
# Filtrar por campo
GET /api/demandas?status=Criada
GET /api/usuarios?nome=João

# Ordenar
GET /api/demandas?_sort=nome_demanda&_order=asc

# Paginar
GET /api/demandas?_page=1&_limit=10

# Buscar texto
GET /api/templates?q=Aluno

# Relações (embed)
GET /api/demandas?_embed=template
```

---

## 🗄️ Database Schema

### db.json

```json
{
  "usuarios": [
    {
      "id": "string",
      "nome": "string",
      "email": "string",
      "login": "string",
      "senha": "string"
    }
  ],
  "templates": [
    {
      "id": "string",
      "nome": "string",
      "prioridade": "Baixa|Média|Alta",
      "campos_preenchimento": [...],
      "tarefas": [...]
    }
  ],
  "demandas": [
    {
      "id": "string",
      "template_id": "string",
      "nome_demanda": "string",
      "status": "Criada|Em Andamento|Finalizada",
      "prioridade": "Baixa|Média|Alta",
      "responsavel_id": "string",
      "campos_preenchidos": [...],
      "tarefas_status": [...]
    }
  ]
}
```

---

## 🔧 Configuração

### Variáveis de Ambiente

```bash
PORT=3000              # Porta do servidor
NODE_ENV=development   # Ambiente
```

### package.json

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node scripts/seed.js"
  }
}
```

---

## 🔄 Migration para PostgreSQL

Quando estiver pronto para escalar, veja `../MIGRATION_GUIDE.md`.

O backend foi desenhado para facilitar esta migração:

1. Manter mesmas rotas (`/api/usuarios`, etc)
2. Substituir JSON-Server por Express
3. Adicionar Prisma ou TypeORM
4. Conectar PostgreSQL
5. Frontend continua igual!

---

## 🐛 Debug

### Ver logs
```bash
# Docker
docker-compose logs -f backend

# Local
npm run dev
```

### Testar endpoints
```bash
# Health check
curl http://localhost:3000/health

# Listar usuários
curl http://localhost:3000/api/usuarios

# Criar usuário
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","email":"teste@test.com","login":"teste","senha":"123456"}'
```

### Resetar database
```bash
npm run seed
```

---

## 📚 Recursos

- [JSON-Server Documentation](https://github.com/typicode/json-server)
- [Express.js](https://expressjs.com/) (para upgrade futuro)
- [Prisma](https://www.prisma.io/) (para PostgreSQL)

---

**Backend simples e eficiente para MVP! 🚀**

