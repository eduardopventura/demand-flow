/**
 * Demanda Service
 * 
 * Lógica de negócio centralizada para demandas
 */

const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const fs = require('fs');

const { 
  getUsuarioById, 
  getTemplateById, 
  getDemandaById, 
  getAcaoById,
  getNomeTarefaById,
  updateDemanda,
  deleteDemanda,
  createDemanda
} = require('../utils/db.helpers');

const { 
  calcularAtualizacoesStatus, 
  calcularDataPrevisao
} = require('../utils/status.utils');

const { 
  buscarValorCampo, 
  mapearCamposParaAcao 
} = require('../utils/campo.utils');

const notificationService = require('./notification.service');
const socketService = require('./socket.service');

/**
 * Cria uma nova demanda
 * @param {Object} dados - Dados para criação
 * @param {string} dados.template_id - ID do template
 * @param {string} dados.responsavel_id - ID do responsável
 * @param {Object} dados.campos_valores - Valores dos campos
 * @returns {Promise<Object>} - Demanda criada
 */
async function criarDemanda({ template_id, responsavel_id, campos_valores, userId }) {
  // Buscar template
  const template = await getTemplateById(template_id);
  if (!template) {
    throw { status: 404, error: 'Template não encontrado', message: `Template com ID ${template_id} não existe` };
  }

  // Fase 4: responsável da demanda é sempre um usuário (não cargo)
  const responsavel = await getUsuarioById(responsavel_id);
  if (!responsavel) {
    throw { status: 404, error: 'Responsável não encontrado', message: `Usuário com ID ${responsavel_id} não existe` };
  }

  // Calcular nome da demanda
  let nomeDemanda = template.nome;
  const campoComplementaNome = template.campos_preenchimento.find(c => c.complementa_nome);
  if (campoComplementaNome && campos_valores && campos_valores[campoComplementaNome.id_campo]) {
    nomeDemanda = `${template.nome} - ${campos_valores[campoComplementaNome.id_campo]}`;
  }

  // Calcular datas
  const dataCriacao = new Date();
  const tempoMedio = template.tempo_medio || 7;
  const dataPrevisao = calcularDataPrevisao(dataCriacao, tempoMedio);

  // Preparar dados da demanda
  const demandaData = {
    template_id: template_id,
    nome_demanda: nomeDemanda,
    status: 'Criada',
    responsavel_id: responsavel_id,
    tempo_esperado: tempoMedio,
    data_criacao: dataCriacao,
    data_previsao: dataPrevisao,
    data_finalizacao: null,
    prazo: true,
    observacoes: '',
    notificacao_prazo_enviada: false
  };

  if (!template.tarefas || template.tarefas.length === 0) {
    throw { status: 400, error: 'Template inválido', message: 'Template deve ter pelo menos uma tarefa' };
  }
  
  // Preparar tarefas_status: responsavel_id (usuário) ou cargo_responsavel_id (cargo)
  const tarefasStatus = template.tarefas.map((t) => ({
    id_tarefa: t.id_tarefa,
    concluida: false,
    responsavel_id: t.responsavel_id || null,
    cargo_responsavel_id: t.cargo_responsavel_id || null,
  }));

  const camposPreenchidos = campos_valores 
    ? Object.entries(campos_valores).map(([id_campo, valor]) => ({ id_campo, valor: String(valor) }))
    : [];

  const novaDemanda = await createDemanda(demandaData, tarefasStatus, camposPreenchidos);

  // Emitir evento em tempo real (para outros usuários)
  socketService.emitDemandaCreated(novaDemanda, { actorId: userId });

  try {
    await notificationService.notificarNovaDemandaParaResponsavel(novaDemanda, responsavel_id);
    
    // 2. Notificar responsáveis de tarefas (usuário ou cargo) diferentes do responsável da demanda
    // Usar Set para garantir que cada responsável é notificado apenas uma vez
    const responsaveisNotificados = new Set();
    responsaveisNotificados.add(`u:${responsavel_id}`); // responsável da demanda (usuário)
    
    for (const tarefa of template.tarefas) {
      const usuarioId = tarefa.responsavel_id || null;
      const cargoId = tarefa.cargo_responsavel_id || null;
      
      const key = cargoId ? `c:${cargoId}` : usuarioId ? `u:${usuarioId}` : null;

      // Se a tarefa tem responsável definido e ainda não foi notificado
      if (key && !responsaveisNotificados.has(key)) {
        responsaveisNotificados.add(key);
        
        const nomeTarefa = tarefa.nome_tarefa || 'Tarefa';
        
        try {
          await notificationService.notificarTarefaAtribuidaParaResponsavel(nomeTarefa, novaDemanda, {
            usuario_id: usuarioId,
            cargo_id: cargoId,
          });
        } catch (err) {
          console.error(`   ❌ Erro ao notificar responsável da tarefa:`, err.message);
        }
      }
    }
  } catch (notifError) {
    console.error('Erro ao enviar notificação:', notifError);
  }

  return novaDemanda;
}

/**
 * Atualiza uma demanda existente
 * @param {string} id - ID da demanda
 * @param {Object} updates - Campos a atualizar
 * @param {string} userId - ID do usuário que está modificando a demanda
 * @returns {Promise<Object>} - Demanda atualizada
 */
async function atualizarDemanda(id, updates, userId) {
  // Validar que userId foi fornecido
  if (!userId) {
    throw { status: 401, error: 'Usuário não autenticado', message: 'É necessário estar autenticado para atualizar uma demanda' };
  }

  // Buscar demanda atual
  const demandaRef = await getDemandaById(id);
  if (!demandaRef) {
    throw { status: 404, error: 'Demanda não encontrada', message: `Demanda com ID ${id} não existe` };
  }
  
  // IMPORTANTE: Fazer clone profundo para preservar estado anterior
  const demandaAntes = JSON.parse(JSON.stringify(demandaRef));

  // ============================================================================
  // MERGE POR CAMPO (patch) - evita sobrescrever alterações concorrentes
  // ============================================================================
  // Frontend pode enviar apenas deltas:
  // - tarefas_status_patch: Array parcial por id_tarefa
  // - campos_preenchidos_patch: Array parcial por id_campo
  // - campos_preenchidos_remove: Array de id_campo a remover
  //
  // Aqui aplicamos o patch sobre o estado atual (demandaAntes) e convertemos para
  // o formato completo esperado pela lógica existente (tarefas_status/campos_preenchidos).
  const updatesMerged = { ...updates };
  const tarefasStatusPatch = Array.isArray(updatesMerged.tarefas_status_patch)
    ? updatesMerged.tarefas_status_patch
    : null;
  const camposPatch = Array.isArray(updatesMerged.campos_preenchidos_patch)
    ? updatesMerged.campos_preenchidos_patch
    : null;
  const camposRemove = Array.isArray(updatesMerged.campos_preenchidos_remove)
    ? updatesMerged.campos_preenchidos_remove
    : null;

  if (tarefasStatusPatch && tarefasStatusPatch.length > 0) {
    const base = Array.isArray(demandaAntes.tarefas_status) ? demandaAntes.tarefas_status : [];
    const byId = new Map(base.map((t) => [t.id_tarefa, { ...t }]));

    for (const patch of tarefasStatusPatch) {
      const prev = byId.get(patch.id_tarefa) || { id_tarefa: patch.id_tarefa, concluida: false };
      // patch pode omitir responsavel_id (undefined) => JSON não envia => mantemos o anterior
      const next = {
        ...prev,
        ...patch,
      };
      byId.set(patch.id_tarefa, next);
    }

    updatesMerged.tarefas_status = Array.from(byId.values());
  }

  if (
    (camposPatch && camposPatch.length > 0) ||
    (camposRemove && camposRemove.length > 0)
  ) {
    const base = Array.isArray(demandaAntes.campos_preenchidos) ? demandaAntes.campos_preenchidos : [];
    const byId = new Map(base.map((c) => [c.id_campo, { ...c }]));

    if (camposPatch) {
      for (const patch of camposPatch) {
        byId.set(patch.id_campo, { id_campo: patch.id_campo, valor: String(patch.valor ?? '') });
      }
    }

    if (camposRemove) {
      for (const idCampo of camposRemove) {
        byId.delete(idCampo);
      }
    }

    updatesMerged.campos_preenchidos = Array.from(byId.values());
  }

  // Não deixar campos patch “vazarem” para o Prisma update (colunas inexistentes)
  delete updatesMerged.tarefas_status_patch;
  delete updatesMerged.campos_preenchidos_patch;
  delete updatesMerged.campos_preenchidos_remove;

  // Buscar template para referência
  const template = await getTemplateById(demandaAntes.template_id);

  if (updatesMerged.status === 'Criada' && demandaAntes.status !== 'Criada') {
    throw { 
      status: 400, 
      error: 'Status inválido', 
      message: 'Não é possível voltar o status de uma demanda para "Criada" após ela ter sido movida para outro status' 
    };
  }

  if (updatesMerged.status === 'Em Andamento' && demandaAntes.data_finalizacao) {
    updatesMerged.data_finalizacao = null;
  }

  // Recalcular prazo sempre que a demanda é finalizada
  if (updatesMerged.status === 'Finalizada') {
    const { verificarPrazo } = require('../utils/status.utils');
    
    // Usar data_finalizacao do payload, ou existente, ou criar nova
    let dataFin = updatesMerged.data_finalizacao || demandaAntes.data_finalizacao;
    if (!dataFin) {
      dataFin = new Date();
      updatesMerged.data_finalizacao = dataFin;
    }
    
    // Usar data_previsao atualizada (se enviada) ou a existente
    const dataPrevisao = updatesMerged.data_previsao || demandaAntes.data_previsao;
    
    // Converter para string ISO se necessário
    const dataFinStr = typeof dataFin === 'string' ? dataFin : dataFin.toISOString();
    
    // Sempre recalcular o prazo para garantir consistência
    updatesMerged.prazo = verificarPrazo(dataFinStr, dataPrevisao);
  }

  const updateData = { ...updatesMerged };
  let tarefasStatus = null;
  let camposPreenchidos = null;

  // IMPORTANTE: Verificar e atualizar responsáveis ANTES de salvar
  if (updatesMerged.tarefas_status && userId) {
    console.log('🔍 [DEBUG] Verificando atualização de responsáveis de tarefas...');
    console.log('🔍 [DEBUG] userId:', userId);
    console.log('🔍 [DEBUG] tarefas_status recebidas:', JSON.stringify(updatesMerged.tarefas_status, null, 2));
    
    const tarefasStatusAtuais = demandaAntes.tarefas_status || [];
    console.log('🔍 [DEBUG] tarefas_status atuais no banco:', JSON.stringify(tarefasStatusAtuais, null, 2));
    
    tarefasStatus = updatesMerged.tarefas_status.map(ts => {
      // Verificar se esta tarefa foi modificada (comparar com estado atual)
      const tarefaAtual = tarefasStatusAtuais.find(
        t => t.id_tarefa === ts.id_tarefa
      );
      
      // Comparar responsável (usuário e/ou cargo)
      const responsavelAtualUsuarioId = tarefaAtual?.responsavel_id || null;
      const responsavelNovoUsuarioId = ts.responsavel_id || null;
      const cargoAtualId = tarefaAtual?.cargo_responsavel_id || null;
      const cargoNovoId = ts.cargo_responsavel_id || null;
      
      const concluidaMudou = tarefaAtual ? tarefaAtual.concluida !== ts.concluida : true;
      const responsavelMudou =
        responsavelAtualUsuarioId !== responsavelNovoUsuarioId || cargoAtualId !== cargoNovoId;
      
      // IMPORTANTE: Apenas mudança de responsável (sem mudança em concluida) não deve acionar atualização automática
      const apenasResponsavelMudou = responsavelMudou && !concluidaMudou && tarefaAtual;
      
      const foiModificada = !tarefaAtual || concluidaMudou || responsavelMudou;
      
      console.log(`🔍 [DEBUG] Tarefa ${ts.id_tarefa}:`);
      console.log(`   - Existe no banco: ${!!tarefaAtual}`);
      console.log(`   - Concluída mudou: ${concluidaMudou} (antes: ${tarefaAtual?.concluida}, novo: ${ts.concluida})`);
      console.log(
        `   - Responsável mudou: ${responsavelMudou} (antes: user=${responsavelAtualUsuarioId}, cargo=${cargoAtualId}; novo: user=${responsavelNovoUsuarioId}, cargo=${cargoNovoId})`
      );
      console.log(`   - Apenas responsável mudou (sem concluida): ${apenasResponsavelMudou}`);
      console.log(`   - Foi modificada: ${foiModificada}`);
      
      // Fase 4: cargo e usuário são campos distintos
      let nextResponsavelUsuarioId = responsavelNovoUsuarioId;
      let nextCargoResponsavelId = cargoNovoId;
      
      // Lógica de atualização de responsável:
      // Atualiza o responsável da tarefa para o usuário logado APENAS se:
      // 1. A tarefa foi modificada (concluida mudou) - NÃO atualiza se apenas o responsável mudou
      // 2. O responsável atual (se existir) é diferente do userId
      // 3. Não é um cargo (cargos não são atualizados)
      // 4. Se não tinha responsável antes (null), também atualiza quando concluida mudou
      
      // Verificar se deve atualizar
      const temResponsavelDiferente =
        nextResponsavelUsuarioId && nextResponsavelUsuarioId !== userId;
      const naoTinhaResponsavel =
        !tarefaAtual || (!responsavelAtualUsuarioId && !cargoAtualId);
      
      // Atualiza se:
      // - concluida mudou
      // - NÃO é cargo (cargo_responsavel_id não deve ser sobrescrito automaticamente)
      // - NÃO foi mudança manual só de responsável
      // - (tem responsável diferente OU não tinha responsável)
      const deveAtualizar =
        concluidaMudou &&
        !nextCargoResponsavelId &&
        !apenasResponsavelMudou &&
        (temResponsavelDiferente || naoTinhaResponsavel);
      
      if (deveAtualizar) {
        const responsavelAnterior = nextResponsavelUsuarioId || 'null';
        console.log(`   ✅ ATUALIZANDO responsável de "${responsavelAnterior}" para "${userId}"`);
        nextResponsavelUsuarioId = userId;
        nextCargoResponsavelId = null;
      } else {
        console.log(
          `   ⏭️  Mantendo responsável: user=${nextResponsavelUsuarioId || 'null'} cargo=${nextCargoResponsavelId || 'null'}`
        );
        if (nextCargoResponsavelId) console.log(`   ℹ️  É cargo, não atualiza automaticamente`);
        if (!concluidaMudou) {
          console.log(`   ℹ️  Concluída não mudou, não atualiza responsável automaticamente`);
        }
        if (apenasResponsavelMudou) {
          console.log(`   ℹ️  Apenas responsável mudou (mudança manual), respeitando escolha do usuário`);
        }
        if (nextResponsavelUsuarioId === userId) {
          console.log(`   ℹ️  Responsável já é o usuário logado`);
        }
      }
      
      const resultado = {
        id_tarefa: ts.id_tarefa,
        concluida: ts.concluida || false,
        responsavel_id: nextResponsavelUsuarioId,
        cargo_responsavel_id: nextCargoResponsavelId
      };
      
      console.log(`   📤 Resultado final:`, JSON.stringify(resultado, null, 2));
      
      return resultado;
    });
    
    console.log('🔍 [DEBUG] tarefas_status processadas:', JSON.stringify(tarefasStatus, null, 2));
    console.log('🔍 [DEBUG] Total de tarefas processadas:', tarefasStatus.length);
    
    // Calcular status automaticamente se tarefas foram atualizadas
    const statusUpdates = calcularAtualizacoesStatus(tarefasStatus, demandaAntes);
    Object.assign(updateData, statusUpdates);
    
    delete updateData.tarefas_status; // Remover do updateData, será tratado separadamente
  }

  if (updatesMerged.campos_preenchidos) {
    camposPreenchidos = updatesMerged.campos_preenchidos.map(cp => ({
      id_campo: cp.id_campo,
      valor: String(cp.valor)
    }));
    delete updateData.campos_preenchidos;
  }

  // ============================================================================
  // Atualizar nome_demanda quando um campo "complementa_nome" mudar
  // ============================================================================
  // Regra: nome_demanda = `${template.nome} - ${valorComplemento}` quando valor existe,
  // senão nome_demanda = template.nome.
  //
  // Só recalcula quando campos_preenchidos foi enviado/patch aplicado (camposPreenchidos != null),
  // para evitar recomputar em updates que não mexem nos campos.
  if (template?.campos_preenchimento && camposPreenchidos) {
    const campoComplementaNome = template.campos_preenchimento.find((c) => c?.complementa_nome);

    if (campoComplementaNome?.id_campo) {
      const valorAntesRaw = (demandaAntes.campos_preenchidos || []).find(
        (cp) => cp.id_campo === campoComplementaNome.id_campo
      )?.valor;
      const valorDepoisRaw = camposPreenchidos.find(
        (cp) => cp.id_campo === campoComplementaNome.id_campo
      )?.valor;

      const valorAntes = typeof valorAntesRaw === 'string' ? valorAntesRaw.trim() : '';
      const valorDepois = typeof valorDepoisRaw === 'string' ? valorDepoisRaw.trim() : '';

      // Só atualiza o nome se o valor do campo mudou (inclui mudança para vazio)
      if (valorAntes !== valorDepois) {
        updateData.nome_demanda = valorDepois ? `${template.nome} - ${valorDepois}` : template.nome;
      }
    }
  }

  // Registrar usuário que modificou
  updateData.modificado_por_id = userId;
  console.log('🔍 [DEBUG] Salvando demanda com modificado_por_id:', userId);
  if (tarefasStatus) {
    console.log('🔍 [DEBUG] Salvando com tarefasStatus:', JSON.stringify(tarefasStatus, null, 2));
  }

  // Salvar demanda
  const demandaAtualizada = await updateDemanda(id, updateData, tarefasStatus, camposPreenchidos);
  
  console.log('🔍 [DEBUG] Demanda salva. Tarefas após salvar:', JSON.stringify(demandaAtualizada.tarefas_status, null, 2));

  // IMPORTANTE: Acionar notificações APENAS após salvar e atualizar responsáveis
  if (updates.responsavel_id && updates.responsavel_id !== demandaAntes.responsavel_id) {
    try {
      await notificationService.notificarNovaDemandaParaResponsavel(demandaAtualizada, updates.responsavel_id);
    } catch (err) {
      console.error('Erro ao notificar novo responsável da demanda:', err);
    }
  }

  if (tarefasStatus && template) {
    await processarNotificacoesTarefas(demandaAntes, demandaAtualizada, template, tarefasStatus);
  }

  // Emitir evento em tempo real (para outros usuários)
  socketService.emitDemandaUpdated(demandaAtualizada, { actorId: userId });

  return demandaAtualizada;
}

/**
 * Deleta uma demanda
 * @param {string} id - ID da demanda
 * @param {string} userId - ID do usuário que está deletando a demanda
 * @returns {Promise<{ success: true, id: string }>}
 */
async function deletarDemanda(id, userId) {
  if (!userId) {
    throw {
      status: 401,
      error: 'Usuário não autenticado',
      message: 'É necessário estar autenticado para deletar uma demanda',
    };
  }

  const demanda = await getDemandaById(id);
  if (!demanda) {
    throw {
      status: 404,
      error: 'Demanda não encontrada',
      message: `Demanda com ID ${id} não existe`,
    };
  }

  await deleteDemanda(id);

  // Emitir evento em tempo real (para outros usuários)
  socketService.emitDemandaDeleted(id, { actorId: userId });

  return { success: true, id };
}

/**
 * Processa notificações para mudanças em tarefas
 * @param {Object} demandaAntes - Demanda antes da atualização
 * @param {Object} demandaDepois - Demanda após atualização
 * @param {Object} template - Template da demanda
 * @param {Array} novasTarefasStatus - Novo status das tarefas
 */
async function processarNotificacoesTarefas(demandaAntes, demandaDepois, template, novasTarefasStatus) {
  const { getCargoById, getUsuarioById } = require('../utils/db.helpers');
  
  const demandaResponsavelId = demandaAntes.responsavel_id;
  const responsavelDemanda = demandaResponsavelId ? await getUsuarioById(demandaResponsavelId) : null;

  for (const novoStatus of novasTarefasStatus) {
    const statusAntes = demandaAntes.tarefas_status.find(t => t.id_tarefa === novoStatus.id_tarefa);
    
    if (!statusAntes) continue;
    
    const antes = {
      usuario_id: statusAntes.responsavel_id || null,
      cargo_id: statusAntes.cargo_responsavel_id || null,
    };
    const depois = {
      usuario_id: novoStatus.responsavel_id || null,
      cargo_id: novoStatus.cargo_responsavel_id || null,
    };

    const efetivoAntes = antes.usuario_id || antes.cargo_id || demandaResponsavelId;
    const efetivoDepois = depois.usuario_id || depois.cargo_id || demandaResponsavelId;

    const responsavelMudou =
      antes.usuario_id !== depois.usuario_id || antes.cargo_id !== depois.cargo_id;

    if (responsavelMudou && efetivoDepois && efetivoDepois !== demandaResponsavelId) {
      const nomeTarefa = getNomeTarefaById(template, novoStatus.id_tarefa);
      
      try {
        await notificationService.notificarTarefaAtribuidaParaResponsavel(nomeTarefa, demandaDepois, depois);
      } catch (err) {
        console.error('Erro ao notificar tarefa atribuída:', err);
      }
    }

    // 2. Tarefa foi concluída - notificar responsável da demanda se não está no mesmo grupo
    if (novoStatus.concluida && !statusAntes.concluida) {
      const nomeTarefa = getNomeTarefaById(template, novoStatus.id_tarefa);
      
      // Verificar se o responsável da demanda deve ser notificado
      let deveNotificarResponsavelDemanda = false;
      let quemConcluidNome = null;
      
      // Quem "concluiu" (para mensagem) - melhor esforço: responsável efetivo (usuário/cargo)
      if (depois.cargo_id) {
        const cargo = await getCargoById(depois.cargo_id);
        quemConcluidNome = cargo?.nome || 'Cargo';

        // Notificar responsável da demanda se ele não pertence ao mesmo cargo
        if (responsavelDemanda && responsavelDemanda.cargo_id !== depois.cargo_id) {
          deveNotificarResponsavelDemanda = true;
        }
      } else if (depois.usuario_id && depois.usuario_id !== demandaResponsavelId) {
        deveNotificarResponsavelDemanda = true;
        const quemConcluiu = await getUsuarioById(depois.usuario_id);
        quemConcluidNome = quemConcluiu ? quemConcluiu.nome : 'Desconhecido';
      }
      
      if (deveNotificarResponsavelDemanda) {
        if (responsavelDemanda) {
          try {
            await notificationService.notificarTarefaConcluida(nomeTarefa, demandaDepois, responsavelDemanda, { nome: quemConcluidNome });
          } catch (err) {
            console.error('Erro ao notificar tarefa concluída:', err);
          }
        }
      }
    }
  }
}

/**
 * Executa uma ação automática de uma tarefa
 * @param {string} demandaId - ID da demanda
 * @param {string} tarefaId - ID da tarefa
 * @param {string} userId - ID do usuário que está executando a ação
 * @returns {Promise<Object>} - Resultado da execução
 */
async function executarAcaoTarefa(demandaId, tarefaId, userId) {
  const demanda = await getDemandaById(demandaId);
  if (!demanda) {
    throw { status: 404, error: 'Demanda não encontrada', message: `Demanda com ID ${demandaId} não existe` };
  }

  const template = await getTemplateById(demanda.template_id);
  if (!template) {
    throw { status: 404, error: 'Template não encontrado', message: `Template da demanda não existe` };
  }

  // Buscar tarefa no template
  const tarefaTemplate = template.tarefas.find(t => t.id_tarefa === tarefaId);
  if (!tarefaTemplate) {
    throw { status: 404, error: 'Tarefa não encontrada', message: `Tarefa com ID ${tarefaId} não existe no template` };
  }

  // Verificar se a tarefa tem uma ação associada
  if (!tarefaTemplate.acao_id) {
    throw { status: 400, error: 'Tarefa sem ação', message: 'Esta tarefa não possui uma ação automática associada' };
  }

  // Buscar ação
  const acao = await getAcaoById(tarefaTemplate.acao_id);
  if (!acao) {
    throw { status: 404, error: 'Ação não encontrada', message: `Ação com ID ${tarefaTemplate.acao_id} não existe` };
  }

  // Verificar status da tarefa na demanda
  const tarefaStatus = demanda.tarefas_status.find(t => t.id_tarefa === tarefaId);
  if (tarefaStatus && tarefaStatus.concluida) {
    throw { status: 400, error: 'Tarefa já concluída', message: 'Não é possível executar ação em uma tarefa já concluída' };
  }

  const { payload, hasFile, fileField, filePath } = mapearCamposParaAcao(demanda, acao, tarefaTemplate.mapeamento_campos);
  let webhookResponse;
  try {
    webhookResponse = await executarWebhook(acao.url, payload, hasFile, fileField, filePath);
  } catch (webhookError) {
    const statusCode = webhookError.response?.status;
    const errorMessage = webhookError.response?.data?.message || webhookError.message;
    
    console.error(`   ❌ Erro ao executar ação:`, webhookError.message);
    
    let userMessage = errorMessage;
    if (statusCode === 404) {
      userMessage = `Webhook não encontrado (404). Verifique se a URL está correta e se o workflow está ativo no n8n: ${acao.url}`;
    } else if (statusCode === 500) {
      userMessage = `Erro interno no servidor do webhook (500). Verifique os logs do n8n.`;
    } else if (!statusCode) {
      userMessage = `Não foi possível conectar ao webhook. Verifique se a URL está acessível: ${acao.url}`;
    }
    
    throw { status: 502, error: 'Erro ao executar webhook', message: userMessage, webhookStatus: statusCode, webhookUrl: acao.url };
  }

  // Atualizar tarefa como concluída
  const novasTarefasStatus = demanda.tarefas_status.map(t => 
    t.id_tarefa === tarefaId ? { ...t, concluida: true } : t
  );

  const statusUpdates = calcularAtualizacoesStatus(novasTarefasStatus, demanda);
  const updates = {
    tarefas_status: novasTarefasStatus,
    ...statusUpdates
  };

  const demandaAtualizada = await atualizarDemanda(demandaId, updates, userId);

  // Evento específico (opcional) para indicar que uma tarefa foi finalizada
  socketService.emitTarefaFinalizada(demandaId, tarefaId, { actorId: userId });

  return {
    success: true,
    message: 'Ação executada com sucesso',
    webhookStatus: webhookResponse.status,
    demanda: demandaAtualizada
  };
}

/**
 * Executa um webhook (POST)
 * @param {string} url - URL do webhook
 * @param {Object} payload - Dados a enviar
 * @param {boolean} hasFile - Se tem arquivo
 * @param {string} fileField - Nome do campo do arquivo
 * @param {string} filePath - Caminho do arquivo
 * @returns {Promise<Object>} - Resposta do webhook
 */
async function executarWebhook(url, payload, hasFile, fileField, filePath) {
  if (hasFile && filePath) {
    const absolutePath = path.join(__dirname, '..', filePath.replace(/^\//, ''));
    
    if (!fs.existsSync(absolutePath)) {
      throw { status: 400, error: 'Arquivo não encontrado', message: `O arquivo ${filePath} não existe no servidor` };
    }

    const formData = new FormData();
    
    for (const [key, value] of Object.entries(payload)) {
      formData.append(key, String(value));
    }
    
    const fileName = path.basename(absolutePath);
    formData.append(fileField, fs.createReadStream(absolutePath), fileName);
    
    return axios.post(url, formData, {
      headers: formData.getHeaders(),
      timeout: 30000,
    });
  } else {
    return axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });
  }
}

/**
 * Verifica demandas com prazo próximo e envia notificações
 */
async function verificarPrazosProximos() {
  console.log('\n⏰ Executando verificação de prazos próximos...');
  
  try {
    const demandaRepository = require('../src/repositories/demanda.repository');
    
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999); // Fim do dia de amanhã
    
    // Buscar demandas com prazo próximo (vencem amanhã) e que ainda não foram notificadas
    const demandas = await demandaRepository.findComPrazoProximo(hoje, false);
    
    let notificacoesEnviadas = 0;
    
    for (const demanda of demandas) {
      // Pular se já finalizada
      if (demanda.status === 'Finalizada') continue;
      
      // Pular se já enviou notificação de prazo
      if (demanda.notificacao_prazo_enviada === true) continue;
      
      const dataPrevisao = new Date(demanda.data_previsao);
      dataPrevisao.setHours(0, 0, 0, 0);
      
      const hojeLimpo = new Date();
      hojeLimpo.setHours(0, 0, 0, 0);
      
      // Calcular diferença em dias
      const diffMs = dataPrevisao.getTime() - hojeLimpo.getTime();
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      // Se vence amanhã (1 dia)
      if (diffDias === 1) {
        const responsavel = await getUsuarioById(demanda.responsavel_id);
        
        if (responsavel) {
          try {
            await notificationService.notificarPrazoProximo(demanda, responsavel);
            
            // Marcar que já enviou notificação
            await updateDemanda(demanda.id, { notificacao_prazo_enviada: true });
            notificacoesEnviadas++;
          } catch (notifError) {
            console.error(`   ❌ Erro ao notificar prazo da demanda ${demanda.id}:`, notifError.message);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação de prazos:', error);
  }
}

module.exports = {
  criarDemanda,
  atualizarDemanda,
  deletarDemanda,
  executarAcaoTarefa,
  executarWebhook,
  verificarPrazosProximos,
  processarNotificacoesTarefas
};

