/**
 * Template Repository
 * 
 * Camada de acesso a dados para Templates usando Prisma.
 * Toda criação/atualização de template gera um TemplateVersion snapshot automaticamente.
 */

const { prisma } = require('../database/client');

/**
 * Gera o nome da versão no formato DDMMyyHHmm (sempre 10 dígitos).
 * Exemplo: 24/02/26 às 15:20 → "2402261520"
 */
function gerarNomeVersao(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const dd   = pad(date.getDate());
  const mm   = pad(date.getMonth() + 1);
  const yy   = pad(date.getFullYear() % 100);
  const hh   = pad(date.getHours());
  const min  = pad(date.getMinutes());
  return `${dd}${mm}${yy}${hh}${min}`;
}

/**
 * Cria um snapshot de versão para o template fornecido.
 * @param {Object} template - Template com id, nome, tempo_medio, abas, campos_preenchimento, tarefas
 * @param {Object} tx - Contexto de transação Prisma (opcional)
 */
async function criarVersaoTemplate(template, tx = prisma) {
  return tx.templateVersion.create({
    data: {
      template_id: template.id,
      nome: gerarNomeVersao(),
      dados: {
        id:                   template.id,
        nome:                 template.nome,
        tempo_medio:          template.tempo_medio,
        abas:                 template.abas,
        campos_preenchimento: template.campos_preenchimento,
        tarefas:              template.tarefas,
      },
    },
  });
}

class TemplateRepository {
  /**
   * Busca um template pelo ID
   */
  async findById(id) {
    if (!id) return null;
    return await prisma.template.findUnique({
      where: { id }
    });
  }

  /**
   * Lista todos os templates
   */
  async findAll(filters = {}) {
    const where = {};
    
    if (filters.nome) {
      where.nome = {
        contains: filters.nome,
        mode: 'insensitive'
      };
    }

    return await prisma.template.findMany({
      where,
      orderBy: { nome: 'asc' }
    });
  }

  /**
   * Cria um novo template e gera a versão inicial (v1) automaticamente.
   */
  async create(data) {
    return await prisma.$transaction(async (tx) => {
      const template = await tx.template.create({ data });
      await criarVersaoTemplate(template, tx);
      return template;
    });
  }

  /**
   * Atualiza um template e cria um novo snapshot de versão automaticamente.
   */
  async update(id, data) {
    return await prisma.$transaction(async (tx) => {
      const template = await tx.template.update({
        where: { id },
        data
      });
      await criarVersaoTemplate(template, tx);
      return template;
    });
  }

  /**
   * Deleta um template (cascade: TemplateVersion rows apagadas via DB cascade).
   */
  async delete(id) {
    return await prisma.template.delete({
      where: { id }
    });
  }

  /**
   * Lista todas as versões de um template, ordenadas da mais recente para a mais antiga.
   * Retorna apenas id, nome, created_at (sem o blob dados para performance).
   */
  async findVersionsByTemplateId(templateId) {
    if (!templateId) return [];
    return await prisma.templateVersion.findMany({
      where: { template_id: templateId },
      select: { id: true, nome: true, created_at: true },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Busca uma versão específica de template pelo ID, incluindo os dados completos.
   */
  async findVersionById(versionId) {
    if (!versionId) return null;
    return await prisma.templateVersion.findUnique({
      where: { id: versionId },
    });
  }
}

module.exports = new TemplateRepository();
