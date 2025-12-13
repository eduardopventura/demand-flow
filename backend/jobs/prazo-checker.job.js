/**
 * Prazo Checker Job
 * 
 * Job agendado para verificar demandas com prazo próximo
 * Executa a cada hora e envia notificações apenas uma vez por demanda
 */

const cron = require('node-cron');
const demandaService = require('../services/demanda.service');

let dbInstance = null;

/**
 * Define a instância do banco de dados para o job
 * @param {Object} db - Instância do lowdb
 */
function setDatabase(db) {
  dbInstance = db;
}

/**
 * Executa a verificação de prazos
 */
async function executarVerificacao() {
  if (!dbInstance) {
    console.error('❌ Job de prazo: banco de dados não configurado');
    return;
  }
  
  await demandaService.verificarPrazosProximos(dbInstance);
}

/**
 * Inicia o job de verificação de prazos
 * @param {Object} db - Instância do lowdb
 */
function iniciar(db) {
  setDatabase(db);
  
  // Agendar verificação a cada hora (minuto 0)
  cron.schedule('0 * * * *', executarVerificacao);
  
  console.log('⏰ Job de verificação de prazos agendado (a cada hora)');
  
  // Executar verificação inicial após 5 segundos
  setTimeout(executarVerificacao, 5000);
}

module.exports = {
  iniciar,
  executarVerificacao,
  setDatabase
};

