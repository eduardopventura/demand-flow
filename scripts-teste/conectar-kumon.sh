#!/usr/bin/env bash
# Conecta o backend do demand-flow (dev) à rede do kumon, para o teste de integração
# da Ação → POST /api/v1/students/full.
#
# Por que um script e não o docker-compose? O serviço do demand-flow se chama "backend"
# (igual ao do kumon). Se anexado via compose, o Compose registra o alias "backend" na
# kumon-network, colidindo com o backend do kumon e quebrando o proxy do kumon-frontend
# (404 intermitente em TODO o kumon). O `docker network connect` abaixo usa o NOME DO
# CONTAINER (demand-flow-backend), sem registrar o alias "backend" — sem colisão.
#
# Rode DEPOIS de subir as duas stacks. É idempotente. Refaça após um --force-recreate.
set -euo pipefail

NET="kumon-network"
CONT="demand-flow-backend"

if ! docker network inspect "$NET" >/dev/null 2>&1; then
  echo "ERRO: rede '$NET' não existe. Suba a stack do kumon primeiro (docker compose up -d)." >&2
  exit 1
fi

if docker network inspect "$NET" --format '{{range .Containers}}{{.Name}} {{end}}' | grep -qw "$CONT"; then
  echo "OK — '$CONT' já está conectado a '$NET'."
else
  docker network connect "$NET" "$CONT"
  echo "Conectado '$CONT' a '$NET'."
fi

# Verificação: o backend do demand-flow alcança a API do kumon?
echo -n "Testando alcance kumon-backend:3000/api/health ... "
docker exec "$CONT" node -e "
  require('http').get('http://kumon-backend:3000/api/health', r => { console.log(r.statusCode); process.exit(r.statusCode === 200 ? 0 : 1); })
    .on('error', e => { console.log('ERRO: ' + e.message); process.exit(1); });
"
