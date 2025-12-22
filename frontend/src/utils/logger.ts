/**
 * Logger Utility
 * 
 * Utilitário para logging que remove logs em produção
 * para evitar exposição de informações no console do navegador
 */

const isProduction = import.meta.env.PROD;

/**
 * Log apenas em desenvolvimento
 * @param {...any} args - Argumentos para log
 */
export function log(...args: unknown[]): void {
  if (!isProduction) {
    console.log(...args);
  }
}

/**
 * Log de erro (sempre executa, mas apenas em desenvolvimento mostra detalhes)
 * @param {...any} args - Argumentos para log
 */
export function error(...args: unknown[]): void {
  if (!isProduction) {
    console.error(...args);
  }
  // Em produção, erros críticos podem ser enviados para um serviço de monitoramento
  // Exemplo: Sentry, LogRocket, etc.
}

/**
 * Log de aviso apenas em desenvolvimento
 * @param {...any} args - Argumentos para log
 */
export function warn(...args: unknown[]): void {
  if (!isProduction) {
    console.warn(...args);
  }
}

/**
 * Log de informação apenas em desenvolvimento
 * @param {...any} args - Argumentos para log
 */
export function info(...args: unknown[]): void {
  if (!isProduction) {
    console.info(...args);
  }
}

/**
 * Log de debug apenas em desenvolvimento
 * @param {...any} args - Argumentos para log
 */
export function debug(...args: unknown[]): void {
  if (!isProduction) {
    console.debug(...args);
  }
}

