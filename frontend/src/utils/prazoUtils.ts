/**
 * Utilitários para cálculo e verificação de prazos de demandas
 */

/**
 * Calcula a diferença em dias entre duas datas
 */
export const calcularDiferencaDias = (dataInicio: string, dataFim: string): number => {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  const diffTime = fim.getTime() - inicio.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Verifica se a demanda está dentro do prazo
 */
export const verificarDentroPrazo = (
  dataCriacao: string,
  dataFinalizacao: string | null,
  tempoEsperado: number
): boolean => {
  if (!dataFinalizacao) {
    // Se não foi finalizada ainda, verifica se ainda está dentro do prazo
    const diasDecorridos = calcularDiferencaDias(dataCriacao, new Date().toISOString());
    return diasDecorridos <= tempoEsperado;
  }
  
  // Se foi finalizada, verifica se finalizou dentro do prazo
  const diasUtilizados = calcularDiferencaDias(dataCriacao, dataFinalizacao);
  return diasUtilizados <= tempoEsperado;
};

/**
 * Calcula quantos dias faltam para o prazo
 */
export const diasRestantesPrazo = (
  dataCriacao: string,
  tempoEsperado: number
): number => {
  const diasDecorridos = calcularDiferencaDias(dataCriacao, new Date().toISOString());
  return tempoEsperado - diasDecorridos;
};

/**
 * Calcula quantos dias faltam até a data de previsão
 */
export const diasRestantesAtePrevisao = (dataPrevisao: string): number => {
  const previsao = new Date(dataPrevisao);
  const hoje = new Date();
  // Zerar horas para comparar apenas dias
  previsao.setHours(0, 0, 0, 0);
  hoje.setHours(0, 0, 0, 0);
  const diffTime = previsao.getTime() - hoje.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Determina a cor da borda do card baseado no status do prazo
 * Verde: mais de 1 dia até a data de previsão
 * Amarelo: falta 1 dia ou menos até a data de previsão
 * Vermelho: passou da data de previsão e não foi finalizada
 */
export const getCorBordaPrazo = (
  dataPrevisao: string,
  dataFinalizacao: string | null
): 'verde' | 'amarelo' | 'vermelho' => {
  // Se já foi finalizada, verificar se finalizou dentro do prazo
  if (dataFinalizacao) {
    const finalizacao = new Date(dataFinalizacao);
    const previsao = new Date(dataPrevisao);
    return finalizacao > previsao ? 'vermelho' : 'verde';
  }
  
  // Se ainda não foi finalizada
  const diasRestantes = diasRestantesAtePrevisao(dataPrevisao);
  
  if (diasRestantes < 0) {
    return 'vermelho'; // Passou da data de previsão
  } else if (diasRestantes <= 1) {
    return 'amarelo'; // Falta 1 dia ou menos
  } else {
    return 'verde'; // Mais de 1 dia até a previsão
  }
};

/**
 * Formata data para exibição (DD/MM/YYYY)
 */
export const formatarData = (dataISO: string | null): string => {
  if (!dataISO) return '';
  
  const data = new Date(dataISO);
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  
  return `${dia}/${mes}/${ano}`;
};

/**
 * Extrai o primeiro nome de um nome completo
 */
export const getPrimeiroNome = (nomeCompleto: string): string => {
  return nomeCompleto.split(' ')[0];
};

/**
 * Extrai o nome sem o template do nome da demanda
 * Se o nome for "Template - Complemento", retorna "Complemento"
 * Se o nome for apenas "Template", retorna null (para ordenar por último)
 */
export const extrairNomeSemTemplate = (nomeDemanda: string): string | null => {
  const partes = nomeDemanda.split(" - ");
  if (partes.length > 1) {
    // Tem complemento, retorna a parte depois do " - "
    return partes.slice(1).join(" - ").trim();
  }
  // Só tem o template, retorna null para ordenar por último
  return null;
};

/**
 * Ordena demandas para status "Criada" e "Em Andamento"
 * 1. Por data de previsão crescente
 * 2. Por ordem alfabética do nome (ignorando template)
 * 3. Demandas que só têm nome do template ficam por último
 */
export const ordenarDemandasCriadasOuEmAndamento = <T extends { 
  nome_demanda: string; 
  data_previsao: string; 
  data_finalizacao: string | null;
}>(
  demandas: T[]
): T[] => {
  return [...demandas].sort((a, b) => {
    // Primeiro: ordenar por data de previsão crescente
    const dataPrevisaoA = new Date(a.data_previsao).getTime();
    const dataPrevisaoB = new Date(b.data_previsao).getTime();
    
    if (dataPrevisaoA !== dataPrevisaoB) {
      return dataPrevisaoA - dataPrevisaoB;
    }
    
    // Se as datas forem iguais, ordenar alfabeticamente pelo nome (ignorando template)
    const nomeA = extrairNomeSemTemplate(a.nome_demanda);
    const nomeB = extrairNomeSemTemplate(b.nome_demanda);
    
    // Se ambos têm complemento, ordenar alfabeticamente
    if (nomeA && nomeB) {
      return nomeA.localeCompare(nomeB, 'pt-BR', { sensitivity: 'base' });
    }
    
    // Se só A tem complemento, A vem antes
    if (nomeA && !nomeB) {
      return -1;
    }
    
    // Se só B tem complemento, B vem antes
    if (!nomeA && nomeB) {
      return 1;
    }
    
    // Se nenhum tem complemento, manter ordem original
    return 0;
  });
};

/**
 * Ordena demandas para status "Finalizada"
 * 1. Por data de finalização decrescente
 * 2. Por ordem alfabética do nome (ignorando template)
 * 3. Demandas que só têm nome do template ficam por último
 */
export const ordenarDemandasFinalizadas = <T extends { 
  nome_demanda: string; 
  data_finalizacao: string | null;
}>(
  demandas: T[]
): T[] => {
  return [...demandas].sort((a, b) => {
    // Primeiro: ordenar por data de finalização decrescente
    if (!a.data_finalizacao && !b.data_finalizacao) {
      // Se nenhuma tem data, manter ordem original
      return 0;
    }
    if (!a.data_finalizacao) {
      return 1; // a vai depois
    }
    if (!b.data_finalizacao) {
      return -1; // b vai depois
    }
    
    const dataFinalizacaoA = new Date(a.data_finalizacao).getTime();
    const dataFinalizacaoB = new Date(b.data_finalizacao).getTime();
    
    if (dataFinalizacaoA !== dataFinalizacaoB) {
      return dataFinalizacaoB - dataFinalizacaoA; // Decrescente
    }
    
    // Se as datas forem iguais, ordenar alfabeticamente pelo nome (ignorando template)
    const nomeA = extrairNomeSemTemplate(a.nome_demanda);
    const nomeB = extrairNomeSemTemplate(b.nome_demanda);
    
    // Se ambos têm complemento, ordenar alfabeticamente
    if (nomeA && nomeB) {
      return nomeA.localeCompare(nomeB, 'pt-BR', { sensitivity: 'base' });
    }
    
    // Se só A tem complemento, A vem antes
    if (nomeA && !nomeB) {
      return -1;
    }
    
    // Se só B tem complemento, B vem antes
    if (!nomeA && nomeB) {
      return 1;
    }
    
    // Se nenhum tem complemento, manter ordem original
    return 0;
  });
};

/**
 * Ordena demandas por dias até a data de previsão (menos dias = topo, atrasadas no topo)
 * @deprecated Use ordenarDemandasCriadasOuEmAndamento ou ordenarDemandasFinalizadas
 */
export const ordenarDemandas = <T extends { data_previsao: string; data_finalizacao: string | null }>(
  demandas: T[]
): T[] => {
  return ordenarDemandasCriadasOuEmAndamento(demandas);
};

