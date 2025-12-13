/**
 * Error Middleware - Tratamento Centralizado de Erros
 * 
 * Middleware para tratamento consistente de erros em todas as rotas
 */

/**
 * Classe base para erros da aplicação
 */
class AppError extends Error {
  constructor(status, error, message) {
    super(message);
    this.status = status;
    this.error = error;
    this.isOperational = true;
  }
}

/**
 * Cria um erro 404 Not Found
 */
const notFound = (resource, id) => {
  return new AppError(404, `${resource} não encontrado`, `${resource} com ID ${id} não existe`);
};

/**
 * Cria um erro 400 Bad Request
 */
const badRequest = (message) => {
  return new AppError(400, 'Requisição inválida', message);
};

/**
 * Cria um erro 502 Bad Gateway (para webhooks)
 */
const webhookError = (message, webhookUrl, webhookStatus) => {
  const error = new AppError(502, 'Erro ao executar webhook', message);
  error.webhookUrl = webhookUrl;
  error.webhookStatus = webhookStatus;
  return error;
};

/**
 * Wrapper para funções async em rotas Express
 * Captura erros e passa para o middleware de erro
 * @param {Function} fn - Função async da rota
 * @returns {Function} - Middleware que trata erros
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware de tratamento de erros
 * Deve ser registrado APÓS todas as rotas
 */
const errorHandler = (err, req, res, next) => {
  // Log do erro
  console.error('❌ Erro:', err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Se o erro tem status, é um erro conhecido
  if (err.status) {
    const response = {
      error: err.error || 'Erro',
      message: err.message
    };

    // Adicionar campos extras se existirem (ex: webhookUrl, webhookStatus)
    if (err.webhookUrl) response.webhookUrl = err.webhookUrl;
    if (err.webhookStatus) response.webhookStatus = err.webhookStatus;

    return res.status(err.status).json(response);
  }

  // Erro desconhecido
  res.status(500).json({
    error: 'Erro interno',
    message: process.env.NODE_ENV === 'production' 
      ? 'Ocorreu um erro interno no servidor' 
      : err.message
  });
};

/**
 * Middleware para rotas não encontradas
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.method} ${req.path} não existe`
  });
};

module.exports = {
  AppError,
  notFound,
  badRequest,
  webhookError,
  asyncHandler,
  errorHandler,
  notFoundHandler
};

