/**
 * Prazo Checker Job
 * 
 * Job agendado para verificar demandas com prazo próximo
 * Executa a cada hora e envia notificações apenas uma vez por demanda
 */

const cron = require('node-cron');
const demandaService = require('../services/demanda.service');

/**
 * Executa a verificação de prazos
 */
async function executarVerificacao() {
  await demandaService.verificarPrazosProximos();
}

/**
 * Inicia o job de verificação de prazos
 */
function iniciar() {
  // Agendar verificação a cada hora (minuto 0)
  cron.schedule('0 * * * *', executarVerificacao);
  
  console.log('⏰ Job de verificação de prazos agendado (a cada hora)');
  
  // Executar verificação inicial após 5 segundos
  setTimeout(executarVerificacao, 5000);
}

module.exports = {
  iniciar,
  executarVerificacao
};

