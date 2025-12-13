/**
 * Notification Service - Orquestrador de Notificações
 * 
 * Gerencia o envio de notificações por diferentes canais
 * baseado nas preferências do usuário
 * Suporta notificação por cargo (notifica todos os usuários do cargo individualmente)
 */

const emailService = require('./email.service');
const whatsappService = require('./whatsapp.service');
const { isCargo, resolverResponsavelParaUsuarios } = require('../utils/db.helpers');
const { formatarData } = require('../utils/status.utils');

/**
 * Envia notificação para um usuário pelos canais habilitados
 * @param {Object} usuario - Objeto do usuário
 * @param {string} usuario.email - Email do usuário
 * @param {string} usuario.telefone - Telefone do usuário
 * @param {boolean} usuario.notificar_email - Se deve notificar por email
 * @param {boolean} usuario.notificar_telefone - Se deve notificar por telefone
 * @param {Object} emailContent - Conteúdo do email (assunto, mensagem, html)
 * @param {Object} whatsappContent - Conteúdo do WhatsApp (mensagem, tipo)
 * @param {Object} [demandaData] - Dados da demanda para o webhook
 * @returns {Promise<Object>} - Resultado dos envios
 */
async function notificarUsuario(usuario, emailContent, whatsappContent, demandaData = null) {
  const resultados = {
    email: null,
    whatsapp: null
  };

  // Enviar por email se habilitado
  if (usuario.notificar_email && usuario.email) {
    console.log(`📧 Enviando email para ${usuario.nome} (${usuario.email})...`);
    resultados.email = await emailService.enviarEmail({
      para: usuario.email,
      assunto: emailContent.assunto,
      mensagem: emailContent.mensagem,
      html: emailContent.html
    });
  }

  // Enviar por WhatsApp se habilitado
  if (usuario.notificar_telefone && usuario.telefone) {
    console.log(`📱 Enviando WhatsApp para ${usuario.nome} (${usuario.telefone})...`);
    resultados.whatsapp = await whatsappService.enviarWhatsApp({
      telefone: usuario.telefone,
      mensagem: whatsappContent.mensagem,
      tipo: whatsappContent.tipo,
      demanda: demandaData
    });
  }

  // Log se nenhum canal habilitado
  if (!usuario.notificar_email && !usuario.notificar_telefone) {
    console.log(`⏭️ Usuário ${usuario.nome} não tem notificações habilitadas, pulando...`);
  }

  return resultados;
}

/**
 * Notifica múltiplos usuários individualmente
 * @param {Array} usuarios - Lista de usuários a notificar
 * @param {Function} getEmailContent - Função que recebe o usuário e retorna o conteúdo do email
 * @param {Function} getWhatsappContent - Função que recebe o usuário e retorna o conteúdo do WhatsApp
 * @param {Object} demandaData - Dados da demanda para o webhook
 * @returns {Promise<Array>} - Array de resultados
 */
async function notificarMultiplosUsuarios(usuarios, getEmailContent, getWhatsappContent, demandaData) {
  const resultados = [];
  
  for (const usuario of usuarios) {
    try {
      const emailContent = getEmailContent(usuario);
      const whatsappContent = getWhatsappContent(usuario);
      const resultado = await notificarUsuario(usuario, emailContent, whatsappContent, demandaData);
      resultados.push({ usuario: usuario.id, ...resultado });
    } catch (err) {
      console.error(`   ❌ Erro ao notificar ${usuario.nome}:`, err.message);
      resultados.push({ usuario: usuario.id, error: err.message });
    }
  }
  
  return resultados;
}

/**
 * Notifica sobre nova demanda criada
 * @param {Object} demanda - Objeto da demanda
 * @param {Object} responsavel - Objeto do usuário responsável
 * @returns {Promise<Object>} - Resultado dos envios
 */
async function notificarNovaDemanda(demanda, responsavel) {
  const dataFormatada = formatarData(demanda.data_previsao);
  
  const emailContent = emailService.templates.novaDemanda(
    demanda.nome_demanda,
    dataFormatada,
    responsavel.nome
  );
  
  const whatsappContent = whatsappService.templates.novaDemanda(
    demanda.nome_demanda,
    dataFormatada,
    responsavel.nome
  );
  
  const demandaData = {
    id: demanda.id,
    nome: demanda.nome_demanda,
    data_previsao: dataFormatada
  };
  
  return notificarUsuario(responsavel, emailContent, whatsappContent, demandaData);
}

/**
 * Notifica sobre nova demanda para múltiplos usuários (resolvidos de cargo ou usuário)
 * @param {Object} db - Instância do lowdb
 * @param {Object} demanda - Objeto da demanda
 * @param {string} responsavelId - ID do responsável (usuário ou cargo)
 * @returns {Promise<Array>} - Resultados dos envios
 */
async function notificarNovaDemandaParaResponsavel(db, demanda, responsavelId) {
  const usuarios = resolverResponsavelParaUsuarios(db, responsavelId);
  
  if (usuarios.length === 0) {
    return [];
  }
  
  const dataFormatada = formatarData(demanda.data_previsao);
  const demandaData = {
    id: demanda.id,
    nome: demanda.nome_demanda,
    data_previsao: dataFormatada
  };
  
  return notificarMultiplosUsuarios(
    usuarios,
    (usuario) => emailService.templates.novaDemanda(demanda.nome_demanda, dataFormatada, usuario.nome),
    (usuario) => whatsappService.templates.novaDemanda(demanda.nome_demanda, dataFormatada, usuario.nome),
    demandaData
  );
}

/**
 * Notifica sobre tarefa atribuída a um novo responsável
 * @param {string} nomeTarefa - Nome da tarefa
 * @param {Object} demanda - Objeto da demanda
 * @param {Object} novoResponsavel - Objeto do novo responsável da tarefa
 * @returns {Promise<Object>} - Resultado dos envios
 */
async function notificarTarefaAtribuida(nomeTarefa, demanda, novoResponsavel) {
  const emailContent = emailService.templates.tarefaAtribuida(
    nomeTarefa,
    demanda.nome_demanda,
    novoResponsavel.nome
  );
  
  const whatsappContent = whatsappService.templates.tarefaAtribuida(
    nomeTarefa,
    demanda.nome_demanda,
    novoResponsavel.nome
  );
  
  const demandaData = {
    id: demanda.id,
    nome: demanda.nome_demanda,
    tarefa: nomeTarefa
  };  
  return notificarUsuario(novoResponsavel, emailContent, whatsappContent, demandaData);
}

/**
 * Notifica sobre tarefa atribuída para múltiplos usuários (resolvidos de cargo ou usuário)
 * @param {Object} db - Instância do lowdb
 * @param {string} nomeTarefa - Nome da tarefa
 * @param {Object} demanda - Objeto da demanda
 * @param {string} responsavelId - ID do responsável (usuário ou cargo)
 * @returns {Promise<Array>} - Resultados dos envios
 */
async function notificarTarefaAtribuidaParaResponsavel(db, nomeTarefa, demanda, responsavelId) {
  const usuarios = resolverResponsavelParaUsuarios(db, responsavelId);
  
  if (usuarios.length === 0) {
    return [];
  }
  
  const demandaData = {
    id: demanda.id,
    nome: demanda.nome_demanda,
    tarefa: nomeTarefa
  };
  
  return notificarMultiplosUsuarios(
    usuarios,
    (usuario) => emailService.templates.tarefaAtribuida(nomeTarefa, demanda.nome_demanda, usuario.nome),
    (usuario) => whatsappService.templates.tarefaAtribuida(nomeTarefa, demanda.nome_demanda, usuario.nome),
    demandaData
  );
}

/**
 * Notifica sobre tarefa concluída (quando responsável diferente do responsável da demanda)
 * @param {string} nomeTarefa - Nome da tarefa
 * @param {Object} demanda - Objeto da demanda
 * @param {Object} responsavelDemanda - Objeto do responsável da demanda
 * @param {Object} quemConcluiu - Objeto do usuário que concluiu a tarefa
 * @returns {Promise<Object>} - Resultado dos envios
 */
async function notificarTarefaConcluida(nomeTarefa, demanda, responsavelDemanda, quemConcluiu) {
  const emailContent = emailService.templates.tarefaConcluida(
    nomeTarefa,
    demanda.nome_demanda,
    responsavelDemanda.nome,
    quemConcluiu.nome
  );
  
  const whatsappContent = whatsappService.templates.tarefaConcluida(
    nomeTarefa,
    demanda.nome_demanda,
    responsavelDemanda.nome,
    quemConcluiu.nome
  );
  
  const demandaData = {
    id: demanda.id,
    nome: demanda.nome_demanda,
    tarefa: nomeTarefa,
    concluida_por: quemConcluiu.nome
  };
  
  return notificarUsuario(responsavelDemanda, emailContent, whatsappContent, demandaData);
}

/**
 * Notifica sobre prazo próximo (1 dia)
 * @param {Object} demanda - Objeto da demanda
 * @param {Object} responsavel - Objeto do usuário responsável
 * @returns {Promise<Object>} - Resultado dos envios
 */
async function notificarPrazoProximo(demanda, responsavel) {
  const dataFormatada = formatarData(demanda.data_previsao);
  
  const emailContent = emailService.templates.prazoProximo(
    demanda.nome_demanda,
    dataFormatada,
    responsavel.nome
  );
  
  const whatsappContent = whatsappService.templates.prazoProximo(
    demanda.nome_demanda,
    dataFormatada,
    responsavel.nome
  );
  
  const demandaData = {
    id: demanda.id,
    nome: demanda.nome_demanda,
    data_previsao: dataFormatada
  };
  
  return notificarUsuario(responsavel, emailContent, whatsappContent, demandaData);
}

module.exports = {
  notificarUsuario,
  notificarMultiplosUsuarios,
  notificarNovaDemanda,
  notificarNovaDemandaParaResponsavel,
  notificarTarefaAtribuida,
  notificarTarefaAtribuidaParaResponsavel,
  notificarTarefaConcluida,
  notificarPrazoProximo
};

