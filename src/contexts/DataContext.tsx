import React, { createContext, useContext, useState, useEffect } from "react";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  login: string;
  senha: string;
}

export interface CampoPreenchimento {
  id_campo: string;
  nome_campo: string;
  obrigatorio_criacao: boolean;
}

export interface Tarefa {
  id_tarefa: string;
  nome_tarefa: string;
  link_pai: string | null;
}

export interface Template {
  id: string;
  nome: string;
  prioridade: "Baixa" | "Média" | "Alta";
  campos_preenchimento: CampoPreenchimento[];
  tarefas: Tarefa[];
}

export interface CampoPreenchido {
  id_campo: string;
  valor: string;
}

export interface TarefaStatus {
  id_tarefa: string;
  concluida: boolean;
}

export interface Demanda {
  id: string;
  template_id: string;
  nome_demanda: string;
  status: "Criada" | "Em Andamento" | "Finalizada";
  prioridade: "Baixa" | "Média" | "Alta";
  responsavel_id: string;
  campos_preenchidos: CampoPreenchido[];
  tarefas_status: TarefaStatus[];
}

interface DataContextType {
  usuarios: Usuario[];
  templates: Template[];
  demandas: Demanda[];
  addUsuario: (usuario: Omit<Usuario, "id">) => void;
  updateUsuario: (id: string, usuario: Omit<Usuario, "id">) => void;
  deleteUsuario: (id: string) => void;
  addTemplate: (template: Omit<Template, "id">) => void;
  updateTemplate: (id: string, template: Omit<Template, "id">) => void;
  deleteTemplate: (id: string) => void;
  addDemanda: (demanda: Omit<Demanda, "id">) => void;
  updateDemanda: (id: string, demanda: Partial<Demanda>) => void;
  deleteDemanda: (id: string) => void;
  getTemplate: (id: string) => Template | undefined;
  getUsuario: (id: string) => Usuario | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [demandas, setDemandas] = useState<Demanda[]>([]);

  // Inicializar com dados de exemplo
  useEffect(() => {
    const usuariosIniciais: Usuario[] = [
      { id: "u1", nome: "João Silva", email: "joao@empresa.com", login: "joao", senha: "123456" },
      { id: "u2", nome: "Maria Santos", email: "maria@empresa.com", login: "maria", senha: "123456" },
      { id: "u3", nome: "Pedro Costa", email: "pedro@empresa.com", login: "pedro", senha: "123456" },
    ];

    const templatesIniciais: Template[] = [
      {
        id: "t1",
        nome: "Cadastro de Novo Aluno",
        prioridade: "Alta",
        campos_preenchimento: [
          { id_campo: "c1", nome_campo: "Nome do Aluno", obrigatorio_criacao: true },
          { id_campo: "c2", nome_campo: "Email", obrigatorio_criacao: true },
          { id_campo: "c3", nome_campo: "Telefone", obrigatorio_criacao: false },
        ],
        tarefas: [
          { id_tarefa: "ta1", nome_tarefa: "Gerar Contrato", link_pai: null },
          { id_tarefa: "ta2", nome_tarefa: "Enviar Boleto", link_pai: "ta1" },
          { id_tarefa: "ta3", nome_tarefa: "Confirmar Pagamento", link_pai: "ta2" },
        ],
      },
      {
        id: "t2",
        nome: "Renovação de Matrícula",
        prioridade: "Média",
        campos_preenchimento: [
          { id_campo: "c4", nome_campo: "Matrícula", obrigatorio_criacao: true },
          { id_campo: "c5", nome_campo: "Série Atual", obrigatorio_criacao: true },
        ],
        tarefas: [
          { id_tarefa: "ta4", nome_tarefa: "Verificar Pendências", link_pai: null },
          { id_tarefa: "ta5", nome_tarefa: "Gerar Nova Matrícula", link_pai: "ta4" },
        ],
      },
    ];

    const demandasIniciais: Demanda[] = [
      {
        id: "d1",
        template_id: "t1",
        nome_demanda: "Cadastro de Novo Aluno",
        status: "Criada",
        prioridade: "Alta",
        responsavel_id: "u1",
        campos_preenchidos: [
          { id_campo: "c1", valor: "Ana Paula" },
          { id_campo: "c2", valor: "ana@email.com" },
          { id_campo: "c3", valor: "11999998888" },
        ],
        tarefas_status: [
          { id_tarefa: "ta1", concluida: false },
          { id_tarefa: "ta2", concluida: false },
          { id_tarefa: "ta3", concluida: false },
        ],
      },
      {
        id: "d2",
        template_id: "t1",
        nome_demanda: "Cadastro de Novo Aluno",
        status: "Em Andamento",
        prioridade: "Alta",
        responsavel_id: "u2",
        campos_preenchidos: [
          { id_campo: "c1", valor: "Carlos Eduardo" },
          { id_campo: "c2", valor: "carlos@email.com" },
          { id_campo: "c3", valor: "11988887777" },
        ],
        tarefas_status: [
          { id_tarefa: "ta1", concluida: true },
          { id_tarefa: "ta2", concluida: false },
          { id_tarefa: "ta3", concluida: false },
        ],
      },
      {
        id: "d3",
        template_id: "t2",
        nome_demanda: "Renovação de Matrícula",
        status: "Finalizada",
        prioridade: "Média",
        responsavel_id: "u3",
        campos_preenchidos: [
          { id_campo: "c4", valor: "MAT2023001" },
          { id_campo: "c5", valor: "8º Ano" },
        ],
        tarefas_status: [
          { id_tarefa: "ta4", concluida: true },
          { id_tarefa: "ta5", concluida: true },
        ],
      },
    ];

    setUsuarios(usuariosIniciais);
    setTemplates(templatesIniciais);
    setDemandas(demandasIniciais);
  }, []);

  const addUsuario = (usuario: Omit<Usuario, "id">) => {
    const newUsuario = { ...usuario, id: `u${Date.now()}` };
    setUsuarios([...usuarios, newUsuario]);
  };

  const updateUsuario = (id: string, usuario: Omit<Usuario, "id">) => {
    setUsuarios(usuarios.map((u) => (u.id === id ? { ...usuario, id } : u)));
  };

  const deleteUsuario = (id: string) => {
    setUsuarios(usuarios.filter((u) => u.id !== id));
  };

  const addTemplate = (template: Omit<Template, "id">) => {
    const newTemplate = { ...template, id: `t${Date.now()}` };
    setTemplates([...templates, newTemplate]);
  };

  const updateTemplate = (id: string, template: Omit<Template, "id">) => {
    setTemplates(templates.map((t) => (t.id === id ? { ...template, id } : t)));
  };

  const deleteTemplate = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
  };

  const addDemanda = (demanda: Omit<Demanda, "id">) => {
    const newDemanda = { ...demanda, id: `d${Date.now()}` };
    setDemandas([...demandas, newDemanda]);
  };

  const updateDemanda = (id: string, demanda: Partial<Demanda>) => {
    setDemandas(demandas.map((d) => (d.id === id ? { ...d, ...demanda } : d)));
  };

  const deleteDemanda = (id: string) => {
    setDemandas(demandas.filter((d) => d.id !== id));
  };

  const getTemplate = (id: string) => templates.find((t) => t.id === id);
  const getUsuario = (id: string) => usuarios.find((u) => u.id === id);

  return (
    <DataContext.Provider
      value={{
        usuarios,
        templates,
        demandas,
        addUsuario,
        updateUsuario,
        deleteUsuario,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        addDemanda,
        updateDemanda,
        deleteDemanda,
        getTemplate,
        getUsuario,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
