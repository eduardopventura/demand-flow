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
    return finalizacao <= previsao ? 'verde' : 'vermelho';
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
 * Ordena demandas por dias até a data de previsão (menos dias = topo, atrasadas no topo)
 */
export const ordenarDemandas = <T extends { data_previsao: string; data_finalizacao: string | null }>(
  demandas: T[]
): T[] => {
  return [...demandas].sort((a, b) => {
    // Para demandas finalizadas, colocar por último
    if (a.data_finalizacao && !b.data_finalizacao) {
      return 1; // a vai depois de b
    }
    if (!a.data_finalizacao && b.data_finalizacao) {
      return -1; // a vai antes de b
    }
    
    // Ambas não finalizadas - ordenar por dias restantes (menos dias = topo)
    if (!a.data_finalizacao && !b.data_finalizacao) {
      const diasRestantesA = diasRestantesAtePrevisao(a.data_previsao);
      const diasRestantesB = diasRestantesAtePrevisao(b.data_previsao);
      return diasRestantesA - diasRestantesB; // Ordem crescente (menos dias restantes primeiro, atrasadas no topo)
    }
    
    // Ambas finalizadas - ordenar por data de finalização (mais recente primeiro)
    if (a.data_finalizacao && b.data_finalizacao) {
      return new Date(b.data_finalizacao).getTime() - new Date(a.data_finalizacao).getTime();
    }

    return 0;
  });
};

