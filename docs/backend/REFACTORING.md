# Refatoração do Backend

Documentação das melhorias e refatorações realizadas no backend.

## 1. Middleware Centralizado de Erro

Implementado um sistema robusto de tratamento de erros para padronizar as respostas da API e facilitar a depuração.

### Arquivo: `backend/middlewares/error.middleware.js`

Inclui:
- `AppError`: Classe base para erros operacionais conhecidos.
- `asyncHandler`: Wrapper para evitar try-catch repetitivos em rotas async.
- `errorHandler`: Middleware final que captura erros e formata a resposta JSON.
- Funções auxiliares: `notFound`, `badRequest`, `webhookError`.

### Uso nas Rotas

```javascript
const { asyncHandler } = require('../middlewares/error.middleware');

router.get('/', asyncHandler(async (req, res) => {
  const dados = await service.buscarDados();
  res.json(dados);
}));
```

## 2. Templates de Email Separados

Os templates HTML de email foram extraídos do código JavaScript para arquivos HTML separados, facilitando a manutenção e edição do design.

### Estrutura
- `backend/templates/emails/base.html`: Layout base responsivo.
- `backend/templates/emails/index.js`: Carregador de templates e substituidor de variáveis.

### Como criar novo template
1. Crie um arquivo `.html` em `backend/templates/emails/`.
2. Use variáveis no formato `{{VARIAVEL}}`.
3. Adicione uma função no `index.js` para carregar e preencher o template.

## 3. Utilitários de Campo

Lógica de manipulação de campos (busca de valores, mapeamento, grupos) centralizada para evitar duplicação.

### Arquivo: `backend/utils/campo.utils.js`

Funções:
- `buscarValorCampo`: Busca valor de campo simples ou grupo (lista).
- `buscarValoresCampoGrupo`: Retorna array de valores de um grupo.
- `mapearCamposParaAcao`: Prepara payload para webhooks.

## 4. Limpeza e Otimização

- Remoção de funções duplicadas (`formatarData` agora centralizado em `status.utils.js`).
- Consolidação de rotas e services.
- Melhoria na tipagem e organização de imports.

