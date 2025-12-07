/**
 * Notification Service - Orquestrador de Notificações
 * 
 * Gerencia o envio de notificações por diferentes canais
 * baseado nas preferências do usuário
 */

const emailService = require('./email.service');
const whatsappService = require('./whatsapp.service');

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

  console.log(`\n🔔 NOTIFICAÇÃO: Nova Demanda`);
  console.log(`   Demanda: ${demanda.nome_demanda}`);
  console.log(`   Responsável: ${responsavel.nome}`);
  
  return notificarUsuario(responsavel, emailContent, whatsappContent, demandaData);
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

  console.log(`\n🔔 NOTIFICAÇÃO: Tarefa Atribuída`);
  console.log(`   Tarefa: ${nomeTarefa}`);
  console.log(`   Demanda: ${demanda.nome_demanda}`);
  console.log(`   Novo Responsável: ${novoResponsavel.nome}`);
  
  return notificarUsuario(novoResponsavel, emailContent, whatsappContent, demandaData);
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

  console.log(`\n🔔 NOTIFICAÇÃO: Tarefa Concluída`);
  console.log(`   Tarefa: ${nomeTarefa}`);
  console.log(`   Demanda: ${demanda.nome_demanda}`);
  console.log(`   Responsável da Demanda: ${responsavelDemanda.nome}`);
  console.log(`   Concluída por: ${quemConcluiu.nome}`);
  
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

  console.log(`\n🔔 NOTIFICAÇÃO: Prazo Próximo`);
  console.log(`   Demanda: ${demanda.nome_demanda}`);
  console.log(`   Prazo: ${dataFormatada}`);
  console.log(`   Responsável: ${responsavel.nome}`);
  
  return notificarUsuario(responsavel, emailContent, whatsappContent, demandaData);
}

module.exports = {
  notificarUsuario,
  notificarNovaDemanda,
  notificarTarefaAtribuida,
  notificarTarefaConcluida,
  notificarPrazoProximo,
  formatarData
};

