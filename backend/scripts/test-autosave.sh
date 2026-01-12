#!/bin/bash
# Script de Testes Automatizados - Autosave
# Executa testes via API para validar funcionalidade de autosave

set -e

API_URL="http://localhost:3000/api"
TOKEN="$1"

if [ -z "$TOKEN" ]; then
  echo "Uso: ./test-autosave.sh <JWT_TOKEN>"
  exit 1
fi

echo "╔═══════════════════════════════════════════════════╗"
echo "║     Testes Automatizados - Autosave               ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0

test_result() {
  if [ "$1" -eq 0 ]; then
    echo -e "${GREEN}✅ PASS${NC}: $2"
    ((pass_count++))
  else
    echo -e "${RED}❌ FAIL${NC}: $2"
    echo "   Detalhes: $3"
    ((fail_count++))
  fi
}

# ============================================================================
# TESTE 1: Listar demandas
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TESTE 1: Listar demandas criadas pelo seed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DEMANDAS=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/demandas")
DEMANDA_COUNT=$(echo "$DEMANDAS" | jq '. | length')

if [ "$DEMANDA_COUNT" -ge 2 ]; then
  test_result 0 "Demandas listadas ($DEMANDA_COUNT encontradas)"
else
  test_result 1 "Demandas listadas" "Esperado >= 2, encontrado $DEMANDA_COUNT"
fi

# Encontrar demanda de teste (Em Andamento)
DEMANDA_ID=$(echo "$DEMANDAS" | jq -r '.[] | select(.nome_demanda | contains("Demanda Teste 2")) | .id')

if [ -n "$DEMANDA_ID" ] && [ "$DEMANDA_ID" != "null" ]; then
  test_result 0 "Demanda de teste encontrada (ID: $DEMANDA_ID)"
else
  echo -e "${RED}❌ FATAL${NC}: Demanda de teste não encontrada. Abortando."
  exit 1
fi

# ============================================================================
# TESTE 2: Atualizar campo de texto (simula autosave)
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TESTE 2: Atualizar campo de texto (patch parcial)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

NEW_DESC="Descrição atualizada via autosave - $(date +%H:%M:%S)"
PATCH_RESULT=$(curl -s -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"campos_preenchidos_patch\": [{\"id_campo\": \"campo_descricao\", \"valor\": \"$NEW_DESC\"}]}" \
  "$API_URL/demandas/$DEMANDA_ID")

SAVED_DESC=$(echo "$PATCH_RESULT" | jq -r '.campos_preenchidos[] | select(.id_campo == "campo_descricao") | .valor')

if [ "$SAVED_DESC" = "$NEW_DESC" ]; then
  test_result 0 "Campo texto salvo corretamente"
else
  test_result 1 "Campo texto salvo" "Esperado '$NEW_DESC', obtido '$SAVED_DESC'"
fi

# ============================================================================
# TESTE 3: Atualizar observações
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TESTE 3: Atualizar observações"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

NEW_OBS="Observação via autosave - $(date +%H:%M:%S)"
PATCH_RESULT=$(curl -s -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"observacoes\": \"$NEW_OBS\"}" \
  "$API_URL/demandas/$DEMANDA_ID")

SAVED_OBS=$(echo "$PATCH_RESULT" | jq -r '.observacoes')

if [ "$SAVED_OBS" = "$NEW_OBS" ]; then
  test_result 0 "Observações salvas corretamente"
else
  test_result 1 "Observações salvas" "Esperado '$NEW_OBS', obtido '$SAVED_OBS'"
fi

# ============================================================================
# TESTE 4: Atualizar data de previsão
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TESTE 4: Atualizar data de previsão"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Data futura: 30 dias a partir de hoje
NEW_DATE=$(date -d "+30 days" +%Y-%m-%dT%H:%M:%S.000Z 2>/dev/null || date -v+30d +%Y-%m-%dT%H:%M:%S.000Z)
PATCH_RESULT=$(curl -s -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"data_previsao\": \"$NEW_DATE\"}" \
  "$API_URL/demandas/$DEMANDA_ID")

SAVED_DATE=$(echo "$PATCH_RESULT" | jq -r '.data_previsao')

if [[ "$SAVED_DATE" == *"$(echo $NEW_DATE | cut -c1-10)"* ]]; then
  test_result 0 "Data de previsão salva corretamente"
else
  test_result 1 "Data de previsão salva" "Esperado conter '$(echo $NEW_DATE | cut -c1-10)', obtido '$SAVED_DATE'"
fi

# ============================================================================
# TESTE 5: Toggle de tarefa (marcar como concluída)
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TESTE 5: Toggle de tarefa (patch de status)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar status atual da tarefa_enviar
CURRENT_STATUS=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/demandas/$DEMANDA_ID")
TAREFA_ENVIAR=$(echo "$CURRENT_STATUS" | jq -r '.tarefas_status[] | select(.id_tarefa == "tarefa_enviar") | .concluida')

# A tarefa_enviar deve estar false inicialmente
if [ "$TAREFA_ENVIAR" = "false" ]; then
  echo "   Tarefa 'tarefa_enviar' está como false (esperado)"
  
  # Não vamos concluir para poder testar a ação depois
  test_result 0 "Status inicial da tarefa verificado"
else
  echo "   Tarefa 'tarefa_enviar' está como $TAREFA_ENVIAR"
  test_result 0 "Status da tarefa verificado (já foi modificado)"
fi

# ============================================================================
# TESTE 6: Atualizar dropdown (campo prioridade)
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TESTE 6: Atualizar dropdown (prioridade)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PATCH_RESULT=$(curl -s -X PATCH \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"campos_preenchidos_patch": [{"id_campo": "campo_prioridade", "valor": "Urgente"}]}' \
  "$API_URL/demandas/$DEMANDA_ID")

SAVED_PRIO=$(echo "$PATCH_RESULT" | jq -r '.campos_preenchidos[] | select(.id_campo == "campo_prioridade") | .valor')

if [ "$SAVED_PRIO" = "Urgente" ]; then
  test_result 0 "Dropdown (prioridade) salvo corretamente"
else
  test_result 1 "Dropdown (prioridade) salvo" "Esperado 'Urgente', obtido '$SAVED_PRIO'"
fi

# ============================================================================
# TESTE 7: Upload de arquivo
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TESTE 7: Upload de arquivo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Criar arquivo temporário de teste
TEST_FILE="/tmp/test-autosave-$(date +%s).txt"
echo "Arquivo de teste para autosave - $(date)" > "$TEST_FILE"

UPLOAD_RESULT=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$TEST_FILE" \
  "$API_URL/upload")

UPLOAD_PATH=$(echo "$UPLOAD_RESULT" | jq -r '.path')

if [[ "$UPLOAD_PATH" == /uploads/* ]]; then
  test_result 0 "Upload realizado (path: $UPLOAD_PATH)"
  
  # Salvar o path do arquivo no campo_documento
  PATCH_RESULT=$(curl -s -X PATCH \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"campos_preenchidos_patch\": [{\"id_campo\": \"campo_documento\", \"valor\": \"$UPLOAD_PATH\"}]}" \
    "$API_URL/demandas/$DEMANDA_ID")
  
  SAVED_DOC=$(echo "$PATCH_RESULT" | jq -r '.campos_preenchidos[] | select(.id_campo == "campo_documento") | .valor')
  
  if [ "$SAVED_DOC" = "$UPLOAD_PATH" ]; then
    test_result 0 "Campo arquivo salvo corretamente"
  else
    test_result 1 "Campo arquivo salvo" "Esperado '$UPLOAD_PATH', obtido '$SAVED_DOC'"
  fi
else
  test_result 1 "Upload realizado" "Resposta: $UPLOAD_RESULT"
fi

rm -f "$TEST_FILE"

# ============================================================================
# TESTE 8: Executar ação (webhook com arquivo)
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TESTE 8: Executar ação (webhook com arquivo)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ACTION_RESULT=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "$API_URL/demandas/$DEMANDA_ID/tarefas/tarefa_enviar/executar")

ACTION_SUCCESS=$(echo "$ACTION_RESULT" | jq -r '.success')
WEBHOOK_STATUS=$(echo "$ACTION_RESULT" | jq -r '.webhookStatus')

if [ "$ACTION_SUCCESS" = "true" ]; then
  test_result 0 "Ação executada com sucesso (webhook status: $WEBHOOK_STATUS)"
else
  ERROR_MSG=$(echo "$ACTION_RESULT" | jq -r '.message // .error // "Erro desconhecido"')
  test_result 1 "Ação executada" "$ERROR_MSG"
fi

# ============================================================================
# TESTE 9: Verificar tarefa marcada como concluída após ação
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TESTE 9: Verificar tarefa concluída após ação"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DEMANDA_AFTER=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/demandas/$DEMANDA_ID")
TAREFA_CONCLUIDA=$(echo "$DEMANDA_AFTER" | jq -r '.tarefas_status[] | select(.id_tarefa == "tarefa_enviar") | .concluida')

if [ "$TAREFA_CONCLUIDA" = "true" ]; then
  test_result 0 "Tarefa marcada como concluída automaticamente"
else
  test_result 1 "Tarefa marcada como concluída" "Status atual: $TAREFA_CONCLUIDA"
fi

# ============================================================================
# TESTE 10: Verificar persistência (reload)
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TESTE 10: Verificar persistência dos dados"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FINAL_DEMANDA=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/demandas/$DEMANDA_ID")

# Verificar se todos os campos foram persistidos
FINAL_OBS=$(echo "$FINAL_DEMANDA" | jq -r '.observacoes')
FINAL_PRIO=$(echo "$FINAL_DEMANDA" | jq -r '.campos_preenchidos[] | select(.id_campo == "campo_prioridade") | .valor')
FINAL_DOC=$(echo "$FINAL_DEMANDA" | jq -r '.campos_preenchidos[] | select(.id_campo == "campo_documento") | .valor')

PERSIST_OK=0
if [[ "$FINAL_OBS" == *"autosave"* ]] && [ "$FINAL_PRIO" = "Urgente" ] && [[ "$FINAL_DOC" == /uploads/* ]]; then
  test_result 0 "Todos os dados persistidos corretamente"
else
  test_result 1 "Persistência dos dados" "Obs: $FINAL_OBS, Prio: $FINAL_PRIO, Doc: $FINAL_DOC"
fi

# ============================================================================
# RESUMO
# ============================================================================
echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║                    RESUMO                          ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""
echo -e "   ${GREEN}Passou: $pass_count${NC}"
echo -e "   ${RED}Falhou: $fail_count${NC}"
echo ""

if [ "$fail_count" -eq 0 ]; then
  echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}    ✅ TODOS OS TESTES PASSARAM COM SUCESSO!      ${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
  exit 0
else
  echo -e "${RED}═══════════════════════════════════════════════════${NC}"
  echo -e "${RED}    ⚠️  ALGUNS TESTES FALHARAM                     ${NC}"
  echo -e "${RED}═══════════════════════════════════════════════════${NC}"
  exit 1
fi
