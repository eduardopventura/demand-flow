/**
 * Demanda Service
 * 
 * Lógica de negócio centralizada para demandas
 */

const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const { 
  generateId, 
  getUsuarioById, 
  getTemplateById, 
  getDemandaById, 
  getAcaoById,
  getNomeTarefaById,
  getResponsavelEfetivoDaTarefa,
  updateDemanda,
  createDemanda,
  isCargo,
  resolverResponsavelParaUsuarios
} = require('../utils/db.helpers');

const { 
  calcularAtualizacoesStatus, 
  calcularDataPrevisao,
  formatarData 
} = require('../utils/status.utils');

const { 
  buscarValorCampo, 
  mapearCamposParaAcao 
} = require('../utils/campo.utils');

const notificationService = require('./notification.service');

/**
 * Cria uma nova demanda
 * @param {Object} db - Instância do lowdb
 * @param {Object} dados - Dados para criação
 * @param {string} dados.template_id - ID do template
 * @param {string} dados.responsavel_id - ID do responsável
 * @param {Object} dados.campos_valores - Valores dos campos
 * @returns {Promise<Object>} - Demanda criada
 */
async function criarDemanda(db, { template_id, responsavel_id, campos_valores }) {
  // Buscar template
  const template = getTemplateById(db, template_id);
  if (!template) {
    throw { status: 404, error: 'Template não encontrado', message: `Template com ID ${template_id} não existe` };
  }

  // Verificar se responsável_id é um usuário ou cargo válido
  const ehCargo = isCargo(responsavel_id);
  if (!ehCargo) {
    const responsavel = getUsuarioById(db, responsavel_id);
    if (!responsavel) {
      throw { status: 404, error: 'Responsável não encontrado', message: `Usuário com ID ${responsavel_id} não existe` };
    }
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

  // Criar demanda
  const novaDemanda = {
    id: generateId(),
    template_id: template_id,
    nome_demanda: nomeDemanda,
    status: 'Criada',
    prioridade: template.prioridade,
    responsavel_id: responsavel_id,
    tempo_esperado: tempoMedio,
    campos_preenchidos: campos_valores 
      ? Object.entries(campos_valores).map(([id_campo, valor]) => ({ id_campo, valor }))
      : [],
    tarefas_status: template.tarefas.map(t => ({
      id_tarefa: t.id_tarefa,
      concluida: false,
      responsavel_id: t.responsavel_id
    })),
    data_criacao: dataCriacao.toISOString(),
    data_previsao: dataPrevisao.toISOString(),
    data_finalizacao: null,
    prazo: true,
    observacoes: '',
    notificacao_prazo_enviada: false
  };

  // Salvar no banco
  createDemanda(db, novaDemanda);
  console.log(`\n✅ Demanda criada: ${novaDemanda.nome_demanda}`);

  // Enviar notificações
  try {
    // 1. Notificar o responsável da demanda (usuário ou todos do cargo)
    await notificationService.notificarNovaDemandaParaResponsavel(db, novaDemanda, responsavel_id);
    
    // 2. Notificar responsáveis de tarefas que são diferentes do responsável da demanda
    // Usar Set para garantir que cada responsável é notificado apenas uma vez
    const responsaveisNotificados = new Set();
    responsaveisNotificados.add(responsavel_id); // Marcar o responsável da demanda como já notificado
    
    for (const tarefa of template.tarefas) {
      const tarefaResponsavelId = tarefa.responsavel_id;
      
      // Se a tarefa tem responsável definido e é diferente do responsável da demanda
      if (tarefaResponsavelId && !responsaveisNotificados.has(tarefaResponsavelId)) {
        responsaveisNotificados.add(tarefaResponsavelId);
        
        const nomeTarefa = tarefa.nome_tarefa || 'Tarefa';
        console.log(`   📌 Notificando responsável da tarefa "${nomeTarefa}": ${tarefaResponsavelId}`);
        
        try {
          await notificationService.notificarTarefaAtribuidaParaResponsavel(db, nomeTarefa, novaDemanda, tarefaResponsavelId);
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
 * @param {Object} db - Instância do lowdb
 * @param {string} id - ID da demanda
 * @param {Object} updates - Campos a atualizar
 * @returns {Promise<Object>} - Demanda atualizada
 */
async function atualizarDemanda(db, id, updates) {
  // Buscar demanda atual
  const demandaRef = getDemandaById(db, id);
  if (!demandaRef) {
    throw { status: 404, error: 'Demanda não encontrada', message: `Demanda com ID ${id} não existe` };
  }
  
  // IMPORTANTE: Fazer clone profundo para preservar estado anterior
  // (lowdb retorna referências que são modificadas in-place)
  const demandaAntes = JSON.parse(JSON.stringify(demandaRef));

  // Buscar template para referência
  const template = getTemplateById(db, demandaAntes.template_id);

  // VALIDAÇÃO: Não permitir voltar status para "Criada" se já teve outro status
  if (updates.status === 'Criada' && demandaAntes.status !== 'Criada') {
    throw { 
      status: 400, 
      error: 'Status inválido', 
      message: 'Não é possível voltar o status de uma demanda para "Criada" após ela ter sido movida para outro status' 
    };
  }

  // VALIDAÇÃO: Se status muda para "Em Andamento" manualmente, remover data_finalizacao
  if (updates.status === 'Em Andamento' && demandaAntes.data_finalizacao) {
    updates.data_finalizacao = null;
  }

  // VALIDAÇÃO: Se status muda para "Finalizada" manualmente, adicionar data_finalizacao
  if (updates.status === 'Finalizada' && !demandaAntes.data_finalizacao) {
    updates.data_finalizacao = new Date().toISOString();
    const { verificarPrazo } = require('../utils/status.utils');
    updates.prazo = verificarPrazo(updates.data_finalizacao, demandaAntes.data_previsao);
  }

  // Calcular status automaticamente se tarefas foram atualizadas
  if (updates.tarefas_status) {
    const statusUpdates = calcularAtualizacoesStatus(updates.tarefas_status, demandaAntes);
    Object.assign(updates, statusUpdates);
  }

  // Atualizar demanda no banco
  const demandaAtualizada = updateDemanda(db, id, updates);
  console.log(`\n✅ Demanda atualizada: ${demandaAtualizada.nome_demanda}`);

  // Processar notificação de mudança de responsável da demanda
  if (updates.responsavel_id && updates.responsavel_id !== demandaAntes.responsavel_id) {
    console.log(`   📌 Responsável da demanda mudou de ${demandaAntes.responsavel_id} para ${updates.responsavel_id}`);
    try {
      await notificationService.notificarNovaDemandaParaResponsavel(db, demandaAtualizada, updates.responsavel_id);
    } catch (err) {
      console.error('Erro ao notificar novo responsável da demanda:', err);
    }
  }

  // Processar notificações de tarefas
  if (updates.tarefas_status && template) {
    await processarNotificacoesTarefas(db, demandaAntes, demandaAtualizada, template, updates.tarefas_status);
  }

  return demandaAtualizada;
}

/**
 * Processa notificações para mudanças em tarefas
 * @param {Object} db - Instância do lowdb
 * @param {Object} demandaAntes - Demanda antes da atualização
 * @param {Object} demandaDepois - Demanda após atualização
 * @param {Object} template - Template da demanda
 * @param {Array} novasTarefasStatus - Novo status das tarefas
 */
async function processarNotificacoesTarefas(db, demandaAntes, demandaDepois, template, novasTarefasStatus) {
  const { isCargo, getUsuariosByCargo, getUsuarioById: getUserById } = require('../utils/db.helpers');
  
  console.log(`\n📋 Processando notificações de tarefas...`);
  console.log(`   Total de tarefas a verificar: ${novasTarefasStatus.length}`);
  
  for (const novoStatus of novasTarefasStatus) {
    const statusAntes = demandaAntes.tarefas_status.find(t => t.id_tarefa === novoStatus.id_tarefa);
    
    if (!statusAntes) {
      console.log(`   ⚠️ Tarefa ${novoStatus.id_tarefa} não encontrada no status anterior`);
      continue;
    }
    
    console.log(`   🔍 Tarefa ${novoStatus.id_tarefa}: concluida antes=${statusAntes.concluida}, depois=${novoStatus.concluida}`);
    console.log(`      resp antes=${statusAntes.responsavel_id || 'padrão'}, resp depois=${novoStatus.responsavel_id || 'padrão'}`);

    // Responsável efetivo antes e depois
    const respAntes = getResponsavelEfetivoDaTarefa(statusAntes, demandaAntes);
    const respDepois = getResponsavelEfetivoDaTarefa(novoStatus, demandaAntes);
    
    // 1. Mudança de responsável da tarefa
    if (respDepois !== respAntes && respDepois !== demandaAntes.responsavel_id) {
      const nomeTarefa = getNomeTarefaById(template, novoStatus.id_tarefa);
      
      // Se for cargo, usar função que notifica múltiplos usuários
      if (isCargo(respDepois)) {
        console.log(`   📌 Tarefa "${nomeTarefa}" atribuída para cargo: ${respDepois}`);
        try {
          await notificationService.notificarTarefaAtribuidaParaResponsavel(db, nomeTarefa, demandaDepois, respDepois);
        } catch (err) {
          console.error('Erro ao notificar tarefa atribuída para cargo:', err);
        }
      } else {
        // É um usuário específico
        const novoResponsavel = getUsuarioById(db, respDepois);
        if (novoResponsavel) {
          console.log(`   📌 Tarefa "${nomeTarefa}" atribuída para ${novoResponsavel.nome}`);
          try {
            await notificationService.notificarTarefaAtribuida(nomeTarefa, demandaDepois, novoResponsavel);
          } catch (err) {
            console.error('Erro ao notificar tarefa atribuída:', err);
          }
        }
      }
    }

    // 2. Tarefa foi concluída - notificar responsável da demanda se não está no mesmo grupo
    if (novoStatus.concluida && !statusAntes.concluida) {
      const tarefaResponsavelId = respDepois;
      const demandaResponsavelId = demandaAntes.responsavel_id;
      const nomeTarefa = getNomeTarefaById(template, novoStatus.id_tarefa);
      
      // Verificar se o responsável da demanda deve ser notificado
      let deveNotificarResponsavelDemanda = false;
      let quemConcluidNome = null;
      
      if (isCargo(tarefaResponsavelId)) {
        // Tarefa atribuída a um cargo
        // Verificar se o responsável da demanda está nesse cargo
        const usuariosDoCargo = getUsuariosByCargo(db, tarefaResponsavelId);
        const responsavelDemanda = getUsuarioById(db, demandaResponsavelId);
        
        // Se responsável da demanda é um usuário, verificar se está no cargo
        if (responsavelDemanda) {
          const responsavelEstaNoCargo = usuariosDoCargo.some(u => u.id === responsavelDemanda.id);
          if (!responsavelEstaNoCargo) {
            deveNotificarResponsavelDemanda = true;
            // Nome de quem concluiu é o cargo
            quemConcluidNome = tarefaResponsavelId.charAt(0).toUpperCase() + tarefaResponsavelId.slice(1);
          }
        }
        // Se responsável da demanda também é um cargo diferente
        else if (isCargo(demandaResponsavelId) && demandaResponsavelId !== tarefaResponsavelId) {
          // Notificar todos os usuários do cargo da demanda
          const usuariosDemandaCargo = getUsuariosByCargo(db, demandaResponsavelId);
          quemConcluidNome = tarefaResponsavelId.charAt(0).toUpperCase() + tarefaResponsavelId.slice(1);
          
          for (const usuario of usuariosDemandaCargo) {
            if (usuario.notificar_email || usuario.notificar_telefone) {
              console.log(`   ✅ Tarefa "${nomeTarefa}" concluída por ${quemConcluidNome} - notificando ${usuario.nome}`);
              try {
                await notificationService.notificarTarefaConcluida(nomeTarefa, demandaDepois, usuario, { nome: quemConcluidNome });
              } catch (err) {
                console.error('Erro ao notificar tarefa concluída:', err);
              }
            }
          }
          continue; // Já notificou, pular para próxima tarefa
        }
      } else if (tarefaResponsavelId && tarefaResponsavelId !== demandaResponsavelId) {
        // Tarefa atribuída a um usuário específico diferente do responsável da demanda
        deveNotificarResponsavelDemanda = true;
        const quemConcluiu = getUsuarioById(db, tarefaResponsavelId);
        quemConcluidNome = quemConcluiu ? quemConcluiu.nome : 'Desconhecido';
      }
      
      // Notificar responsável da demanda
      if (deveNotificarResponsavelDemanda) {
        // Resolver responsável da demanda para usuários (pode ser cargo)
        if (isCargo(demandaResponsavelId)) {
          const usuariosDemandaCargo = getUsuariosByCargo(db, demandaResponsavelId);
          for (const usuario of usuariosDemandaCargo) {
            if (usuario.notificar_email || usuario.notificar_telefone) {
              console.log(`   ✅ Tarefa "${nomeTarefa}" concluída por ${quemConcluidNome} - notificando ${usuario.nome}`);
              try {
                await notificationService.notificarTarefaConcluida(nomeTarefa, demandaDepois, usuario, { nome: quemConcluidNome });
              } catch (err) {
                console.error('Erro ao notificar tarefa concluída:', err);
              }
            }
          }
        } else {
          const responsavelDemanda = getUsuarioById(db, demandaResponsavelId);
          if (responsavelDemanda) {
            console.log(`   ✅ Tarefa "${nomeTarefa}" concluída por ${quemConcluidNome}`);
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
}

/**
 * Executa uma ação automática de uma tarefa
 * @param {Object} db - Instância do lowdb
 * @param {string} demandaId - ID da demanda
 * @param {string} tarefaId - ID da tarefa
 * @returns {Promise<Object>} - Resultado da execução
 */
async function executarAcaoTarefa(db, demandaId, tarefaId) {
  // Buscar demanda
  const demanda = getDemandaById(db, demandaId);
  if (!demanda) {
    throw { status: 404, error: 'Demanda não encontrada', message: `Demanda com ID ${demandaId} não existe` };
  }

  // Buscar template
  const template = getTemplateById(db, demanda.template_id);
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
  const acao = getAcaoById(db, tarefaTemplate.acao_id);
  if (!acao) {
    throw { status: 404, error: 'Ação não encontrada', message: `Ação com ID ${tarefaTemplate.acao_id} não existe` };
  }

  // Verificar status da tarefa na demanda
  const tarefaStatus = demanda.tarefas_status.find(t => t.id_tarefa === tarefaId);
  if (tarefaStatus && tarefaStatus.concluida) {
    throw { status: 400, error: 'Tarefa já concluída', message: 'Não é possível executar ação em uma tarefa já concluída' };
  }

  // Mapear campos
  const { payload, hasFile, fileField, filePath } = mapearCamposParaAcao(demanda, acao, tarefaTemplate.mapeamento_campos);

  console.log(`\n🚀 Executando ação "${acao.nome}" para tarefa "${tarefaTemplate.nome_tarefa}"`);

  // Executar webhook
  let webhookResponse;
  try {
    webhookResponse = await executarWebhook(acao.url, payload, hasFile, fileField, filePath);
    console.log(`   ✅ Ação executada com sucesso`);
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

  const demandaAtualizada = updateDemanda(db, demandaId, updates);

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
 * @param {Object} db - Instância do lowdb
 */
async function verificarPrazosProximos(db) {
  console.log('\n⏰ Executando verificação de prazos próximos...');
  
  try {
    const demandas = db.get('demandas').value();
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    let notificacoesEnviadas = 0;
    
    for (const demanda of demandas) {
      // Pular se já finalizada
      if (demanda.status === 'Finalizada') continue;
      
      // Pular se já enviou notificação de prazo
      if (demanda.notificacao_prazo_enviada === true) continue;
      
      const dataPrevisao = new Date(demanda.data_previsao);
      dataPrevisao.setHours(0, 0, 0, 0);
      
      // Calcular diferença em dias
      const diffMs = dataPrevisao.getTime() - hoje.getTime();
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      // Se vence amanhã (1 dia)
      if (diffDias === 1) {
        const responsavel = getUsuarioById(db, demanda.responsavel_id);
        
        if (responsavel) {
          console.log(`   ⚠️ Demanda "${demanda.nome_demanda}" vence amanhã - notificando ${responsavel.nome}`);
          
          try {
            await notificationService.notificarPrazoProximo(demanda, responsavel);
            
            // Marcar que já enviou notificação
            updateDemanda(db, demanda.id, { notificacao_prazo_enviada: true });
            notificacoesEnviadas++;
          } catch (notifError) {
            console.error(`   ❌ Erro ao notificar prazo da demanda ${demanda.id}:`, notifError.message);
          }
        }
      }
    }
    
    console.log(`   Notificações de prazo enviadas: ${notificacoesEnviadas}`);
    console.log('✅ Verificação de prazos concluída\n');
  } catch (error) {
    console.error('❌ Erro na verificação de prazos:', error);
  }
}

module.exports = {
  criarDemanda,
  atualizarDemanda,
  executarAcaoTarefa,
  executarWebhook,
  verificarPrazosProximos,
  processarNotificacoesTarefas
};

