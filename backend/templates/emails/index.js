/**
 * Email Templates - Gerenciador de templates de email
 * 
 * Carrega templates HTML e substitui variáveis dinamicamente
 */

const fs = require('fs');
const path = require('path');

// Cache de templates carregados
const templateCache = {};

/**
 * Carrega um template HTML do disco (com cache)
 * @param {string} templateName - Nome do arquivo (sem extensão)
 * @returns {string} - Conteúdo do template
 */
function loadTemplate(templateName) {
  if (templateCache[templateName]) {
    return templateCache[templateName];
  }

  const templatePath = path.join(__dirname, `${templateName}.html`);
  
  if (!fs.existsSync(templatePath)) {
    console.warn(`⚠️ Template ${templateName}.html não encontrado`);
    return null;
  }

  const template = fs.readFileSync(templatePath, 'utf8');
  templateCache[templateName] = template;
  return template;
}

/**
 * Substitui variáveis em um template
 * @param {string} template - Template com {{VARIAVEIS}}
 * @param {Object} vars - Objeto com as variáveis
 * @returns {string} - Template com variáveis substituídas
 */
function replaceVars(template, vars) {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }
  return result;
}

/**
 * Gera HTML para nova demanda
 */
function novaDemanda(nomeDemanda, dataPrevisao, nomeResponsavel) {
  const baseTemplate = loadTemplate('base');
  
  if (!baseTemplate) {
    // Fallback para template inline
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">📋 Nova Demanda Atribuída</h2>
        <p>Olá <strong>${nomeResponsavel}</strong>,</p>
        <p>Uma nova demanda foi atribuída a você:</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>📋 Demanda:</strong> ${nomeDemanda}</p>
          <p style="margin: 5px 0;"><strong>📅 Prazo:</strong> ${dataPrevisao}</p>
        </div>
        <p>Acesse o sistema para mais detalhes.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">Gestor de Demandas Kumon</p>
      </div>
    `;
  }

  return replaceVars(baseTemplate, {
    TITULO: 'Nova Demanda Atribuída',
    COR_TITULO: '#2563eb',
    ICONE: '📋',
    NOME_DESTINATARIO: nomeResponsavel,
    MENSAGEM_INTRO: 'Uma nova demanda foi atribuída a você:',
    COR_FUNDO_BOX: '#f3f4f6',
    ESTILO_BOX_EXTRA: '',
    CONTEUDO_BOX: `
      <p style="margin: 5px 0;"><strong>📋 Demanda:</strong> ${nomeDemanda}</p>
      <p style="margin: 5px 0;"><strong>📅 Prazo:</strong> ${dataPrevisao}</p>
    `
  });
}

/**
 * Gera HTML para tarefa atribuída
 */
function tarefaAtribuida(nomeTarefa, nomeDemanda, nomeResponsavel) {
  const baseTemplate = loadTemplate('base');
  
  if (!baseTemplate) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">✅ Tarefa Atribuída</h2>
        <p>Olá <strong>${nomeResponsavel}</strong>,</p>
        <p>Uma tarefa foi atribuída a você:</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>✅ Tarefa:</strong> ${nomeTarefa}</p>
          <p style="margin: 5px 0;"><strong>📋 Demanda:</strong> ${nomeDemanda}</p>
        </div>
        <p>Acesse o sistema para mais detalhes.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">Gestor de Demandas Kumon</p>
      </div>
    `;
  }

  return replaceVars(baseTemplate, {
    TITULO: 'Tarefa Atribuída',
    COR_TITULO: '#16a34a',
    ICONE: '✅',
    NOME_DESTINATARIO: nomeResponsavel,
    MENSAGEM_INTRO: 'Uma tarefa foi atribuída a você:',
    COR_FUNDO_BOX: '#f3f4f6',
    ESTILO_BOX_EXTRA: '',
    CONTEUDO_BOX: `
      <p style="margin: 5px 0;"><strong>✅ Tarefa:</strong> ${nomeTarefa}</p>
      <p style="margin: 5px 0;"><strong>📋 Demanda:</strong> ${nomeDemanda}</p>
    `
  });
}

/**
 * Gera HTML para tarefa concluída
 */
function tarefaConcluida(nomeTarefa, nomeDemanda, nomeResponsavelDemanda, nomeQuemConcluiu) {
  const baseTemplate = loadTemplate('base');
  
  if (!baseTemplate) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">🎉 Tarefa Concluída</h2>
        <p>Olá <strong>${nomeResponsavelDemanda}</strong>,</p>
        <p>Uma tarefa da sua demanda foi concluída:</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>✅ Tarefa:</strong> ${nomeTarefa}</p>
          <p style="margin: 5px 0;"><strong>📋 Demanda:</strong> ${nomeDemanda}</p>
          <p style="margin: 5px 0;"><strong>👤 Concluída por:</strong> ${nomeQuemConcluiu}</p>
        </div>
        <p>Acesse o sistema para mais detalhes.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">Gestor de Demandas Kumon</p>
      </div>
    `;
  }

  return replaceVars(baseTemplate, {
    TITULO: 'Tarefa Concluída',
    COR_TITULO: '#16a34a',
    ICONE: '🎉',
    NOME_DESTINATARIO: nomeResponsavelDemanda,
    MENSAGEM_INTRO: 'Uma tarefa da sua demanda foi concluída:',
    COR_FUNDO_BOX: '#f3f4f6',
    ESTILO_BOX_EXTRA: '',
    CONTEUDO_BOX: `
      <p style="margin: 5px 0;"><strong>✅ Tarefa:</strong> ${nomeTarefa}</p>
      <p style="margin: 5px 0;"><strong>📋 Demanda:</strong> ${nomeDemanda}</p>
      <p style="margin: 5px 0;"><strong>👤 Concluída por:</strong> ${nomeQuemConcluiu}</p>
    `
  });
}

/**
 * Gera HTML para prazo próximo
 */
function prazoProximo(nomeDemanda, dataPrevisao, nomeResponsavel) {
  const baseTemplate = loadTemplate('base');
  
  if (!baseTemplate) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚠️ Prazo Próximo!</h2>
        <p>Olá <strong>${nomeResponsavel}</strong>,</p>
        <p><strong>ATENÇÃO!</strong> A demanda abaixo vence amanhã:</p>
        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 5px 0;"><strong>📋 Demanda:</strong> ${nomeDemanda}</p>
          <p style="margin: 5px 0;"><strong>📅 Prazo:</strong> ${dataPrevisao}</p>
        </div>
        <p>Acesse o sistema e verifique o status das tarefas.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">Gestor de Demandas Kumon</p>
      </div>
    `;
  }

  return replaceVars(baseTemplate, {
    TITULO: 'Prazo Próximo!',
    COR_TITULO: '#dc2626',
    ICONE: '⚠️',
    NOME_DESTINATARIO: nomeResponsavel,
    MENSAGEM_INTRO: '<strong>ATENÇÃO!</strong> A demanda abaixo vence amanhã:',
    COR_FUNDO_BOX: '#fef2f2',
    ESTILO_BOX_EXTRA: 'border-left: 4px solid #dc2626;',
    CONTEUDO_BOX: `
      <p style="margin: 5px 0;"><strong>📋 Demanda:</strong> ${nomeDemanda}</p>
      <p style="margin: 5px 0;"><strong>📅 Prazo:</strong> ${dataPrevisao}</p>
    `
  });
}

module.exports = {
  html: {
    novaDemanda,
    tarefaAtribuida,
    tarefaConcluida,
    prazoProximo
  },
  loadTemplate,
  replaceVars
};

