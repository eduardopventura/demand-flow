# WhatsApp Webhook - Documentação

Este documento descreve o formato do payload esperado pelo webhook do n8n para envio de mensagens via WhatsApp.

## Configuração

O webhook do WhatsApp é configurado através das variáveis de ambiente no arquivo `.env`:

```env
WHATSAPP_WEBHOOK_URL=https://seu-n8n.com/webhook/demandas
WHATSAPP_ENABLED=true
```

## Formato do Payload

O backend envia uma requisição `POST` para o webhook com o seguinte formato:

### Estrutura do Payload

```json
{
  "telefone": "5561999999999",
  "mensagem": "Conteúdo da mensagem",
  "tipo": "nova_demanda",
  "demanda": {
    "id": "uuid-da-demanda",
    "nome_demanda": "Nome da Demanda",
    "status": "Criada",
    "data_previsao": "2024-12-31T23:59:59.999Z",
    "responsavel": {
      "nome": "Nome do Responsável",
      "telefone": "5561999999999"
    }
  },
  "timestamp": "2024-12-20T10:30:00.000Z"
}
```

### Campos Obrigatórios

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `telefone` | string | Número completo com código do país e DDD (apenas dígitos) | `"5561999999999"` |
| `mensagem` | string | Corpo da mensagem a ser enviada | `"Nova demanda atribuída..."` |
| `tipo` | string | Tipo da notificação (ver tipos abaixo) | `"nova_demanda"` |
| `timestamp` | string | Data/hora da requisição em ISO 8601 | `"2024-12-20T10:30:00.000Z"` |

### Campos Opcionais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `demanda` | object | Dados adicionais da demanda para contexto (pode ser `null`) |

### Formato do Telefone

O telefone deve estar no formato:
- **Apenas dígitos** (sem espaços, parênteses, hífens)
- **Código do país** (ex: 55 para Brasil)
- **DDD** (ex: 61 para Brasília)
- **Número** (ex: 999999999)

**Exemplo:** `5561999999999` (Brasil, DDD 61, número 999999999)

## Tipos de Notificação

### 1. Nova Demanda (`nova_demanda`)

Enviado quando uma nova demanda é criada e atribuída a um responsável.

**Exemplo de mensagem:**
```
📋 *Nova Demanda Atribuída*

Olá João Silva!

Uma nova demanda foi atribuída a você:

*Demanda:* Cadastro de Novo Aluno - Ana Paula
*Prazo:* 2024-12-31

Acesse o sistema para mais detalhes.
```

### 2. Tarefa Atribuída (`tarefa_atribuida`)

Enviado quando uma tarefa específica é atribuída a um responsável.

**Exemplo de mensagem:**
```
✅ *Tarefa Atribuída*

Olá Maria Santos!

Uma tarefa foi atribuída a você:

*Tarefa:* Gerar Contrato
*Demanda:* Cadastro de Novo Aluno - Ana Paula

Acesse o sistema para mais detalhes.
```

### 3. Tarefa Concluída (`tarefa_concluida`)

Enviado quando uma tarefa é concluída, notificando o responsável da demanda.

**Exemplo de mensagem:**
```
🎉 *Tarefa Concluída*

Olá João Silva!

Uma tarefa da sua demanda foi concluída:

*Tarefa:* Gerar Contrato
*Demanda:* Cadastro de Novo Aluno - Ana Paula
*Concluída por:* Maria Santos

Acesse o sistema para mais detalhes.
```

### 4. Prazo Próximo (`prazo_proximo`)

Enviado quando uma demanda está próxima do prazo (1 dia antes).

**Exemplo de mensagem:**
```
⚠️ *ATENÇÃO: Prazo Próximo!*

Olá João Silva!

A demanda abaixo vence *amanhã*:

*Demanda:* Cadastro de Novo Aluno - Ana Paula
*Prazo:* 2024-12-31

Acesse o sistema e verifique o status das tarefas.
```

## Exemplo de Requisição Completa

```bash
curl -X POST https://seu-n8n.com/webhook/demandas \
  -H "Content-Type: application/json" \
  -d '{
    "telefone": "5561999999999",
    "mensagem": "📋 *Nova Demanda Atribuída*\n\nOlá João Silva!\n\nUma nova demanda foi atribuída a você:\n\n*Demanda:* Cadastro de Novo Aluno - Ana Paula\n*Prazo:* 2024-12-31\n\nAcesse o sistema para mais detalhes.",
    "tipo": "nova_demanda",
    "demanda": {
      "id": "d1",
      "nome_demanda": "Cadastro de Novo Aluno - Ana Paula",
      "status": "Criada",
      "data_previsao": "2024-12-31T23:59:59.999Z",
      "responsavel": {
        "nome": "João Silva",
        "telefone": "5561999999999"
      }
    },
    "timestamp": "2024-12-20T10:30:00.000Z"
  }'
```

## Integração com n8n

### Workflow n8n

O webhook do n8n deve:

1. **Receber o payload** do backend
2. **Validar os campos** obrigatórios
3. **Extrair telefone e mensagem**
4. **Enviar para API de WhatsApp** (ex: Twilio, WhatsApp Business API, etc.)
5. **Retornar resposta** (opcional, mas recomendado)

### Exemplo de Resposta Esperada

O backend espera uma resposta HTTP 200 com status de sucesso:

```json
{
  "success": true,
  "messageId": "msg_123456789"
}
```

Em caso de erro, o backend registra o erro nos logs mas não interrompe o fluxo principal.

## Troubleshooting

### Telefone Inválido

**Erro:** `Telefone inválido. Deve conter código do país + DDD + número`

**Solução:** Verificar se o telefone tem pelo menos 12 dígitos e está no formato correto (apenas números).

### Webhook Não Configurado

**Erro:** `WhatsApp não configurado. Defina WHATSAPP_WEBHOOK_URL no .env`

**Solução:** Configurar `WHATSAPP_WEBHOOK_URL` no arquivo `.env` do backend.

### Webhook Desabilitado

**Comportamento:** O sistema não envia mensagens, mas continua funcionando normalmente.

**Solução:** Definir `WHATSAPP_ENABLED=true` no arquivo `.env`.

### Erro HTTP no Webhook

**Comportamento:** O backend registra o erro nos logs mas não interrompe o processo.

**Solução:** Verificar se o webhook do n8n está acessível e funcionando corretamente.

## Notas Importantes

1. **O telefone é normalizado** automaticamente pelo backend (remove caracteres não numéricos)
2. **A mensagem pode conter Markdown** (formatação básica como `*negrito*`)
3. **O campo `demanda` pode ser `null`** em alguns tipos de notificação
4. **O timestamp é sempre em UTC** (ISO 8601)
5. **O backend não bloqueia** se o webhook falhar - apenas registra o erro

