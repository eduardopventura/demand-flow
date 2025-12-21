# Docker Hub - Publicação e Versionamento

> **NOTA:** Este arquivo é temporário e será excluído após a publicação inicial.

## Publicação no Docker Hub

### Pré-requisitos

1. Conta no Docker Hub (https://hub.docker.com)
2. Login via CLI: `docker login`
3. Username: `edpv`

### Processo de Publicação

#### 1. Build das Imagens

```bash
# Backend
docker build -t edpv/demand-flow-backend:latest -t edpv/demand-flow-backend:v1.0.0 ./backend

# Frontend
docker build -t edpv/demand-flow-frontend:latest -t edpv/demand-flow-frontend:v1.0.0 ./frontend
```

#### 2. Push para Docker Hub

```bash
# Push backend
docker push edpv/demand-flow-backend:latest
docker push edpv/demand-flow-backend:v1.0.0

# Push frontend
docker push edpv/demand-flow-frontend:latest
docker push edpv/demand-flow-frontend:v1.0.0
```

#### 3. Push Ambas as Imagens

```bash
# Push todas as tags
docker push edpv/demand-flow-backend:latest
docker push edpv/demand-flow-backend:v1.0.0
docker push edpv/demand-flow-frontend:latest
docker push edpv/demand-flow-frontend:v1.0.0
```

## Versionamento

### Estratégia de Tags

- `latest`: Sempre aponta para a versão mais recente
- `v1.0.0`, `v1.0.1`, etc.: Versões específicas (semantic versioning)

### Atualizar Versão

1. Atualizar versão no `package.json` do backend
2. Build com nova tag: `docker build -t edpv/demand-flow-backend:v1.0.1 ./backend`
3. Push da nova tag: `docker push edpv/demand-flow-backend:v1.0.1`
4. Atualizar `latest`: `docker tag edpv/demand-flow-backend:v1.0.1 edpv/demand-flow-backend:latest && docker push edpv/demand-flow-backend:latest`

## Boas Práticas

1. **Sempre teste localmente antes de publicar**
2. **Use tags de versão específicas** para releases importantes
3. **Mantenha `latest` atualizado** para facilitar uso
4. **Documente breaking changes** nas notas de release
5. **Use multi-stage builds** para imagens menores (já implementado)

## Scripts Úteis

### Script de Build e Push Completo

```bash
#!/bin/bash
# build-and-push.sh

VERSION="v1.0.0"

echo "Building backend..."
docker build -t edpv/demand-flow-backend:latest -t edpv/demand-flow-backend:$VERSION ./backend

echo "Building frontend..."
docker build -t edpv/demand-flow-frontend:latest -t edpv/demand-flow-frontend:$VERSION ./frontend

echo "Pushing backend..."
docker push edpv/demand-flow-backend:latest
docker push edpv/demand-flow-backend:$VERSION

echo "Pushing frontend..."
docker push edpv/demand-flow-frontend:latest
docker push edpv/demand-flow-frontend:$VERSION

echo "Done!"
```

## Troubleshooting

### Erro de Autenticação

```bash
# Fazer login novamente
docker login
```

### Erro de Permissão

- Verificar se você tem permissão para push no repositório `edpv/demand-flow-backend` e `edpv/demand-flow-frontend`
- Criar os repositórios no Docker Hub se não existirem

### Imagem Muito Grande

- Verificar se está usando multi-stage builds (já implementado)
- Verificar se não está incluindo `node_modules` ou arquivos desnecessários

