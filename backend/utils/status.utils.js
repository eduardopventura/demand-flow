/**
 * Status Utilities
 * 
 * Lógica centralizada para cálculo de status de demandas
 */

// Constantes de status fixos (colunas que não podem ser renomeadas/removidas)
const STATUS = {
  CRIADA: 'Criada',
  FINALIZADA: 'Finalizada'
};

/**
 * Calcula o novo status baseado nas tarefas.
 * @param {Array} tarefasStatus - Array de status das tarefas
 * @param {string} statusAtual - Status atual da demanda
 * @param {string} [primeiraColIntermed] - Nome da primeira coluna intermediária (ex: "Em Andamento")
 * @returns {string} - Novo status da demanda
 */
function calcularNovoStatus(tarefasStatus, statusAtual, primeiraColIntermed) {
  if (!tarefasStatus || tarefasStatus.length === 0) {
    return statusAtual && statusAtual !== STATUS.CRIADA ? statusAtual : STATUS.CRIADA;
  }

  const todasConcluidas = tarefasStatus.every(t => t.concluida);
  const algumaConcluida = tarefasStatus.some(t => t.concluida);

  if (todasConcluidas) {
    return STATUS.FINALIZADA;
  } else if (algumaConcluida) {
    // If already in an intermediate column, keep it; otherwise move to the first one
    if (statusAtual && statusAtual !== STATUS.CRIADA && statusAtual !== STATUS.FINALIZADA) {
      return statusAtual;
    }
    return primeiraColIntermed || statusAtual || STATUS.CRIADA;
  }
  
  if (statusAtual && statusAtual !== STATUS.CRIADA) {
    return statusAtual;
  }
  
  return STATUS.CRIADA;
}

/**
 * Verifica se a demanda está dentro do prazo
 * Compara apenas as DATAS (ignora horas) para evitar falsos negativos
 * quando a demanda é finalizada no mesmo dia da previsão.
 * 
 * Usa UTC para evitar problemas de fuso horário.
 * 
 * @param {Date|string} dataFinalizacao - Data de finalização
 * @param {Date|string} dataPrevisao - Data de previsão
 * @returns {boolean} - true se dentro do prazo (finalização <= previsão)
 */
function verificarPrazo(dataFinalizacao, dataPrevisao) {
  const finalizacao = new Date(dataFinalizacao);
  const previsao = new Date(dataPrevisao);
  
  // Extrair apenas ano, mês e dia em UTC para comparar sem hora
  const finalizacaoDate = Date.UTC(
    finalizacao.getUTCFullYear(),
    finalizacao.getUTCMonth(),
    finalizacao.getUTCDate()
  );
  const previsaoDate = Date.UTC(
    previsao.getUTCFullYear(),
    previsao.getUTCMonth(),
    previsao.getUTCDate()
  );
  
  return finalizacaoDate <= previsaoDate;
}

/**
 * Calcula as atualizações necessárias baseado no status das tarefas
 * @param {Array} tarefasStatus - Novo status das tarefas
 * @param {Object} demandaAtual - Demanda atual
 * @param {string} [primeiraColIntermed] - Nome da primeira coluna intermediária
 * @returns {Object} - Objeto com as atualizações (status, data_finalizacao, prazo)
 */
function calcularAtualizacoesStatus(tarefasStatus, demandaAtual, primeiraColIntermed) {
  const updates = {};
  const novoStatus = calcularNovoStatus(tarefasStatus, demandaAtual.status, primeiraColIntermed);
  
  updates.status = novoStatus;

  if (novoStatus === STATUS.FINALIZADA) {
    if (!demandaAtual.data_finalizacao) {
      updates.data_finalizacao = new Date().toISOString();
      updates.prazo = verificarPrazo(
        updates.data_finalizacao, 
        demandaAtual.data_previsao
      );
    }
  } else if (novoStatus !== STATUS.CRIADA) {
    // Any intermediate column: clear data_finalizacao if it had one
    if (demandaAtual.data_finalizacao) {
      updates.data_finalizacao = null;
    }
  } else {
    updates.data_finalizacao = null;
    updates.prazo = true;
  }

  return updates;
}

/**
 * Formata uma data ISO para formato brasileiro
 * @param {string} isoDate - Data em formato ISO
 * @returns {string} - Data formatada (DD/MM/YYYY)
 */
function formatarData(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Calcula a data de previsão baseada no tempo médio do template
 * @param {Date} dataCriacao - Data de criação
 * @param {number} tempoMedio - Tempo médio em dias
 * @returns {Date} - Data de previsão
 */
function calcularDataPrevisao(dataCriacao, tempoMedio) {
  const dataPrevisao = new Date(dataCriacao);
  dataPrevisao.setDate(dataPrevisao.getDate() + (tempoMedio || 7));
  return dataPrevisao;
}

module.exports = {
  STATUS,
  calcularNovoStatus,
  verificarPrazo,
  calcularAtualizacoesStatus,
  formatarData,
  calcularDataPrevisao
};

