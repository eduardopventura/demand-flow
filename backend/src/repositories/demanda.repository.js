/**
 * Demanda Repository
 * 
 * Camada de acesso a dados para Demandas usando Prisma
 * Inclui relacionamentos com TarefaStatus e CampoPreenchido
 */

const { prisma } = require('../database/client');

class DemandaRepository {
  /**
   * Busca uma demanda pelo ID com relacionamentos
   * @param {string} id - ID da demanda
   * @param {Object} options - Opções de busca (include)
   * @returns {Promise<Object|null>} - Demanda encontrada ou null
   */
  async findById(id, options = {}) {
    if (!id) return null;
    
    const include = {
      template: options.includeTemplate !== false,
      responsavel: options.includeResponsavel !== false,
      modificado_por: options.includeModificadoPor !== false ? {
        select: { id: true, nome: true, email: true }
      } : false,
      tarefas_status: options.includeTarefasStatus !== false,
      campos_preenchidos: options.includeCamposPreenchidos !== false,
    };

    const demanda = await prisma.demanda.findUnique({
      where: { id },
      include
    });

    if (!demanda) return null;
    return this._formatDemanda(demanda);
  }

  /**
   * Lista todas as demandas com filtros
   * @param {Object} filters - Filtros opcionais
   * @returns {Promise<Array>} - Lista de demandas
   */
  async findAll(filters = {}) {
    const where = {};
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.responsavel_id) {
      where.responsavel_id = filters.responsavel_id;
    }
    
    if (filters.template_id) {
      where.template_id = filters.template_id;
    }

    if (filters.data_previsao_from) {
      where.data_previsao = {
        ...where.data_previsao,
        gte: new Date(filters.data_previsao_from)
      };
    }

    if (filters.data_previsao_to) {
      where.data_previsao = {
        ...where.data_previsao,
        lte: new Date(filters.data_previsao_to)
      };
    }

    const demandas = await prisma.demanda.findMany({
      where,
      include: {
        template: true,
        responsavel: true,
        modificado_por: {
          select: { id: true, nome: true, email: true }
        },
        tarefas_status: true,
        campos_preenchidos: true
      },
      orderBy: { data_criacao: 'desc' }
    });

    return demandas.map(d => this._formatDemanda(d));
  }

  /**
   * Cria uma nova demanda com tarefas e campos
   * @param {Object} data - Dados da demanda
   * @param {Array} tarefasStatus - Array de tarefas_status
   * @param {Array} camposPreenchidos - Array de campos_preenchidos
   * @returns {Promise<Object>} - Demanda criada
   */
  async create(data, tarefasStatus = [], camposPreenchidos = []) {
    const demanda = await prisma.demanda.create({
      data: {
        ...data,
        tarefas_status: {
          create: tarefasStatus
        },
        campos_preenchidos: {
          create: camposPreenchidos
        }
      },
      include: {
        template: true,
        responsavel: true,
        modificado_por: {
          select: { id: true, nome: true, email: true }
        },
        tarefas_status: true,
        campos_preenchidos: true
      }
    });

    return this._formatDemanda(demanda);
  }

  /**
   * Atualiza uma demanda
   * @param {string} id - ID da demanda
   * @param {Object} data - Dados para atualizar
   * @param {Array} tarefasStatus - Array de tarefas_status para atualizar (opcional)
   * @param {Array} camposPreenchidos - Array de campos_preenchidos para atualizar (opcional)
   * @returns {Promise<Object>} - Demanda atualizada
   */
  async update(id, data, tarefasStatus = null, camposPreenchidos = null) {
    if (tarefasStatus !== null || camposPreenchidos !== null) {
      return await prisma.$transaction(async (tx) => {
        const demanda = await tx.demanda.update({
          where: { id },
          data
        });

        if (tarefasStatus !== null) {
          await tx.tarefaStatus.deleteMany({
            where: { demanda_id: id }
          });

          if (tarefasStatus.length > 0) {
            await tx.tarefaStatus.createMany({
              data: tarefasStatus.map(ts => ({
                ...ts,
                demanda_id: id
              }))
            });
          }
        }

        if (camposPreenchidos !== null) {
          await tx.campoPreenchido.deleteMany({
            where: { demanda_id: id }
          });

          if (camposPreenchidos.length > 0) {
            await tx.campoPreenchido.createMany({
              data: camposPreenchidos.map(cp => ({
                ...cp,
                demanda_id: id
              }))
            });
          }
        }

        const demandaAtualizada = await tx.demanda.findUnique({
          where: { id },
          include: {
            template: true,
            responsavel: true,
            modificado_por: {
              select: { id: true, nome: true, email: true }
            },
            tarefas_status: true,
            campos_preenchidos: true
          }
        });

        return this._formatDemanda(demandaAtualizada);
      });
    }

    // Atualização simples sem relacionamentos
    const demanda = await prisma.demanda.update({
      where: { id },
      data,
      include: {
        template: true,
        responsavel: true,
        modificado_por: {
          select: { id: true, nome: true, email: true }
        },
        tarefas_status: true,
        campos_preenchidos: true
      }
    });

    return this._formatDemanda(demanda);
  }

  /**
   * Deleta uma demanda (cascade delete de tarefas e campos)
   * @param {string} id - ID da demanda
   * @returns {Promise<Object>} - Demanda deletada
   */
  async delete(id) {
    return await prisma.demanda.delete({
      where: { id }
    });
  }

  /**
   * Busca demandas com prazo próximo
   * @param {Date} dataLimite - Data limite para busca
   * @param {boolean} notificacaoEnviada - Se deve buscar apenas com notificação não enviada
   * @returns {Promise<Array>} - Lista de demandas
   */
  async findComPrazoProximo(dataLimite, notificacaoEnviada = false) {
    const where = {
      status: {
        in: ['Criada', 'Em Andamento']
      },
      data_previsao: {
        lte: dataLimite
      },
      prazo: true
    };

    if (notificacaoEnviada !== undefined) {
      where.notificacao_prazo_enviada = notificacaoEnviada;
    }

    const demandas = await prisma.demanda.findMany({
      where,
      include: {
        template: true,
        responsavel: true,
        modificado_por: {
          select: { id: true, nome: true, email: true }
        },
        tarefas_status: true,
        campos_preenchidos: true
      }
    });

    return demandas.map(d => this._formatDemanda(d));
  }

  _formatDemanda(demanda) {
    if (!demanda) return null;

    const formatada = {
      ...demanda,
      data_criacao: demanda.data_criacao ? demanda.data_criacao.toISOString() : null,
      data_previsao: demanda.data_previsao ? demanda.data_previsao.toISOString() : null,
      data_finalizacao: demanda.data_finalizacao ? demanda.data_finalizacao.toISOString() : null,
      created_at: demanda.created_at ? demanda.created_at.toISOString() : null,
      updated_at: demanda.updated_at ? demanda.updated_at.toISOString() : null
    };

    if (demanda.tarefas_status) {
      formatada.tarefas_status = demanda.tarefas_status.map(ts => {
        return {
          id_tarefa: ts.id_tarefa,
          concluida: ts.concluida,
          responsavel_id: ts.responsavel_id !== undefined ? ts.responsavel_id : null,
          cargo_responsavel_id: ts.cargo_responsavel_id !== undefined ? ts.cargo_responsavel_id : null,
        };
      });
    }

    if (demanda.campos_preenchidos) {
      formatada.campos_preenchidos = demanda.campos_preenchidos.map(cp => ({
        id_campo: cp.id_campo,
        valor: cp.valor
      }));
    }

    if (demanda.modificado_por) {
      formatada.modificado_por = {
        id: demanda.modificado_por.id,
        nome: demanda.modificado_por.nome,
        email: demanda.modificado_por.email
      };
    }

    return formatada;
  }
}

module.exports = new DemandaRepository();

