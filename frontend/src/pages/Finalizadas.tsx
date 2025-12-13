import { useState, useMemo } from "react";
import { useData } from "@/contexts/DataContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search, 
  ArrowUpDown, 
  Calendar as CalendarIcon,
  Filter,
  X
} from "lucide-react";
import { DetalhesDemandaModal } from "@/components/modals/DetalhesDemandaModal";
import { DemandaCard } from "@/components/kanban/DemandaCard";
import type { Demanda } from "@/types";
import { StatusDemanda } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ordenarDemandasFinalizadas, extrairNomeSemTemplate } from "@/utils/prazoUtils";

type Ordenacao = "data_finalizacao_desc" | "data_finalizacao_asc" | "nome_asc" | "nome_desc";

export default function Finalizadas() {
  const { demandas, templates, usuarios, getTemplate, getUsuario } = useData();
  const [demandaSelecionada, setDemandaSelecionada] = useState<Demanda | null>(null);
  const [busca, setBusca] = useState("");
  const [templateFiltro, setTemplateFiltro] = useState<string>("all");
  const [usuarioFiltro, setUsuarioFiltro] = useState<string>("all");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("data_finalizacao_desc");

  // Filtrar apenas finalizadas
  const finalizadas = useMemo(() => {
    return demandas.filter((d) => d.status === StatusDemanda.FINALIZADA);
  }, [demandas]);

  // Aplicar filtros
  const finalizadasFiltradas = useMemo(() => {
    let resultado = [...finalizadas];

    // Filtro por busca (nome da demanda)
    if (busca.trim()) {
      const buscaLower = busca.toLowerCase();
      resultado = resultado.filter((d) =>
        d.nome_demanda.toLowerCase().includes(buscaLower)
      );
    }

    // Filtro por template
    if (templateFiltro !== "all") {
      resultado = resultado.filter((d) => d.template_id === templateFiltro);
    }

    // Filtro por usuário
    if (usuarioFiltro !== "all") {
      resultado = resultado.filter((d) => d.responsavel_id === usuarioFiltro);
    }

    // Ordenação
    resultado.sort((a, b) => {
      switch (ordenacao) {
        case "data_finalizacao_desc":
          // Primeiro por data decrescente, depois alfabética
          if (!a.data_finalizacao && !b.data_finalizacao) {
            const nomeA = extrairNomeSemTemplate(a.nome_demanda);
            const nomeB = extrairNomeSemTemplate(b.nome_demanda);
            if (nomeA && nomeB) return nomeA.localeCompare(nomeB, 'pt-BR', { sensitivity: 'base' });
            if (nomeA && !nomeB) return -1;
            if (!nomeA && nomeB) return 1;
            return 0;
          }
          if (!a.data_finalizacao) return 1;
          if (!b.data_finalizacao) return -1;
          const dataDiff = new Date(b.data_finalizacao).getTime() - new Date(a.data_finalizacao).getTime();
          if (dataDiff !== 0) return dataDiff;
          // Se datas iguais, ordenar alfabeticamente
          const nomeA = extrairNomeSemTemplate(a.nome_demanda);
          const nomeB = extrairNomeSemTemplate(b.nome_demanda);
          if (nomeA && nomeB) return nomeA.localeCompare(nomeB, 'pt-BR', { sensitivity: 'base' });
          if (nomeA && !nomeB) return -1;
          if (!nomeA && nomeB) return 1;
          return 0;
        case "data_finalizacao_asc":
          if (!a.data_finalizacao && !b.data_finalizacao) {
            const nomeA = extrairNomeSemTemplate(a.nome_demanda);
            const nomeB = extrairNomeSemTemplate(b.nome_demanda);
            if (nomeA && nomeB) return nomeA.localeCompare(nomeB, 'pt-BR', { sensitivity: 'base' });
            if (nomeA && !nomeB) return -1;
            if (!nomeA && nomeB) return 1;
            return 0;
          }
          if (!a.data_finalizacao) return -1;
          if (!b.data_finalizacao) return 1;
          const dataDiffAsc = new Date(a.data_finalizacao).getTime() - new Date(b.data_finalizacao).getTime();
          if (dataDiffAsc !== 0) return dataDiffAsc;
          // Se datas iguais, ordenar alfabeticamente
          const nomeAAsc = extrairNomeSemTemplate(a.nome_demanda);
          const nomeBAsc = extrairNomeSemTemplate(b.nome_demanda);
          if (nomeAAsc && nomeBAsc) return nomeAAsc.localeCompare(nomeBAsc, 'pt-BR', { sensitivity: 'base' });
          if (nomeAAsc && !nomeBAsc) return -1;
          if (!nomeAAsc && nomeBAsc) return 1;
          return 0;
        case "nome_asc":
          const nomeAAsc2 = extrairNomeSemTemplate(a.nome_demanda);
          const nomeBAsc2 = extrairNomeSemTemplate(b.nome_demanda);
          if (nomeAAsc2 && nomeBAsc2) return nomeAAsc2.localeCompare(nomeBAsc2, 'pt-BR', { sensitivity: 'base' });
          if (nomeAAsc2 && !nomeBAsc2) return -1;
          if (!nomeAAsc2 && nomeBAsc2) return 1;
          return 0;
        case "nome_desc":
          const nomeADesc = extrairNomeSemTemplate(a.nome_demanda);
          const nomeBDesc = extrairNomeSemTemplate(b.nome_demanda);
          if (nomeADesc && nomeBDesc) return nomeBDesc.localeCompare(nomeADesc, 'pt-BR', { sensitivity: 'base' });
          if (nomeADesc && !nomeBDesc) return -1;
          if (!nomeADesc && nomeBDesc) return 1;
          return 0;
        default:
          return 0;
      }
    });

    return resultado;
  }, [finalizadas, busca, templateFiltro, usuarioFiltro, ordenacao]);

  const temFiltros = busca.trim() || templateFiltro !== "all" || usuarioFiltro !== "all";

  const limparFiltros = () => {
    setBusca("");
    setTemplateFiltro("all");
    setUsuarioFiltro("all");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b bg-card">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Demandas Finalizadas</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Consulta completa de todas as demandas finalizadas
            </p>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome da demanda..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtro Template */}
            <Select value={templateFiltro} onValueChange={setTemplateFiltro}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os templates</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro Usuário */}
            <Select value={usuarioFiltro} onValueChange={setUsuarioFiltro}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                {usuarios.map((usuario) => (
                  <SelectItem key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Ordenação */}
            <Select value={ordenacao} onValueChange={(v) => setOrdenacao(v as Ordenacao)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="data_finalizacao_desc">Data (mais recente)</SelectItem>
                <SelectItem value="data_finalizacao_asc">Data (mais antiga)</SelectItem>
                <SelectItem value="nome_asc">Nome (A-Z)</SelectItem>
                <SelectItem value="nome_desc">Nome (Z-A)</SelectItem>
              </SelectContent>
            </Select>

            {/* Botão limpar filtros */}
            {temFiltros && (
              <Button
                variant="outline"
                onClick={limparFiltros}
                className="w-full sm:w-auto"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {finalizadasFiltradas.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {finalizadas.length === 0
                ? "Nenhuma demanda finalizada ainda."
                : "Nenhuma demanda encontrada com os filtros aplicados."}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {finalizadasFiltradas.length} de {finalizadas.length} demanda(s) finalizada(s)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {finalizadasFiltradas.map((demanda) => (
                <div
                  key={demanda.id}
                  onClick={() => setDemandaSelecionada(demanda)}
                  className="cursor-pointer"
                >
                  <DemandaCard demanda={demanda} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalhes */}
      <DetalhesDemandaModal
        demanda={demandaSelecionada}
        open={!!demandaSelecionada}
        onOpenChange={(open) => !open && setDemandaSelecionada(null)}
      />
    </div>
  );
}

