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
 * Determina a cor da borda do card baseado no status do prazo
 * Verde: dentro do prazo
 * Amarelo: faltando 4 dias ou menos
 * Vermelho: fora do prazo
 */
export const getCorBordaPrazo = (
  dataCriacao: string,
  dataFinalizacao: string | null,
  tempoEsperado: number,
  status: string
): 'verde' | 'amarelo' | 'vermelho' => {
  // Se já foi finalizada, verificar se finalizou dentro do prazo
  if (dataFinalizacao) {
    const diasUtilizados = calcularDiferencaDias(dataCriacao, dataFinalizacao);
    return diasUtilizados <= tempoEsperado ? 'verde' : 'vermelho';
  }
  
  // Se ainda não foi finalizada
  const diasRestantes = diasRestantesPrazo(dataCriacao, tempoEsperado);
  
  if (diasRestantes < 0) {
    return 'vermelho'; // Passou do prazo
  } else if (diasRestantes <= 4) {
    return 'amarelo'; // Faltam 4 dias ou menos
  } else {
    return 'verde'; // Dentro do prazo
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
 * Ordena demandas por prioridade (Alta > Média > Baixa) e depois por prazo (menos tempo restante primeiro)
 */
export const ordenarDemandas = <T extends { prioridade: string; data_criacao: string; tempo_esperado: number; data_finalizacao: string | null }>(
  demandas: T[]
): T[] => {
  const prioridadeValor: Record<string, number> = {
    'Alta': 3,
    'Média': 2,
    'Baixa': 1,
  };

  return [...demandas].sort((a, b) => {
    // 1º critério: Prioridade (Alta > Média > Baixa)
    const prioridadeA = prioridadeValor[a.prioridade] || 0;
    const prioridadeB = prioridadeValor[b.prioridade] || 0;
    
    if (prioridadeA !== prioridadeB) {
      return prioridadeB - prioridadeA; // Ordem decrescente (Alta primeiro)
    }

    // 2º critério: Prazo (menos tempo restante primeiro)
    // Para demandas finalizadas, colocar por último dentro da mesma prioridade
    if (a.data_finalizacao && !b.data_finalizacao) {
      return 1; // a vai depois de b
    }
    if (!a.data_finalizacao && b.data_finalizacao) {
      return -1; // a vai antes de b
    }
    
    // Ambas finalizadas ou ambas não finalizadas
    if (!a.data_finalizacao && !b.data_finalizacao) {
      const diasRestantesA = diasRestantesPrazo(a.data_criacao, a.tempo_esperado);
      const diasRestantesB = diasRestantesPrazo(b.data_criacao, b.tempo_esperado);
      return diasRestantesA - diasRestantesB; // Ordem crescente (menos dias restantes primeiro)
    }
    
    // Ambas finalizadas - ordenar por data de finalização (mais recente primeiro)
    if (a.data_finalizacao && b.data_finalizacao) {
      return new Date(b.data_finalizacao).getTime() - new Date(a.data_finalizacao).getTime();
    }

    return 0;
  });
};

