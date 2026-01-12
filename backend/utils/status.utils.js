/**
 * Status Utilities
 * 
 * Lógica centralizada para cálculo de status de demandas
 */

// Constantes de status
const STATUS = {
  CRIADA: 'Criada',
  EM_ANDAMENTO: 'Em Andamento',
  FINALIZADA: 'Finalizada'
};

/**
 * Calcula o novo status baseado nas tarefas
 * @param {Array} tarefasStatus - Array de status das tarefas
 * @param {string} statusAtual - Status atual da demanda (opcional)
 * @returns {string} - Novo status da demanda
 */
function calcularNovoStatus(tarefasStatus, statusAtual) {
  if (!tarefasStatus || tarefasStatus.length === 0) {
    // Se não tem tarefas, retornar Criada apenas se ainda não teve outro status
    return statusAtual && statusAtual !== STATUS.CRIADA ? statusAtual : STATUS.CRIADA;
  }

  const todasConcluidas = tarefasStatus.every(t => t.concluida);
  const algumaConcluida = tarefasStatus.some(t => t.concluida);

  if (todasConcluidas) {
    return STATUS.FINALIZADA;
  } else if (algumaConcluida) {
    return STATUS.EM_ANDAMENTO;
  }
  
  // Se nenhuma tarefa concluída, manter status atual se já teve outro status (não voltar para Criada)
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
 * @returns {Object} - Objeto com as atualizações (status, data_finalizacao, prazo)
 */
function calcularAtualizacoesStatus(tarefasStatus, demandaAtual) {
  const updates = {};
  const novoStatus = calcularNovoStatus(tarefasStatus, demandaAtual.status);
  
  updates.status = novoStatus;

  if (novoStatus === STATUS.FINALIZADA) {
    // Definir data de finalização se ainda não existe
    if (!demandaAtual.data_finalizacao) {
      updates.data_finalizacao = new Date().toISOString();
      updates.prazo = verificarPrazo(
        updates.data_finalizacao, 
        demandaAtual.data_previsao
      );
    }
  } else if (novoStatus === STATUS.EM_ANDAMENTO) {
    // Se estava finalizada e foi reaberta, remover data de finalização
    if (demandaAtual.status === STATUS.FINALIZADA) {
      updates.data_finalizacao = null;
    }
    // Se tinha data_finalizacao mas mudou para Em Andamento, remover
    if (demandaAtual.data_finalizacao) {
      updates.data_finalizacao = null;
    }
  } else {
    // Status Criada - limpar data de finalização
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

