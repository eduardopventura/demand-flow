import { useData } from "@/contexts/DataContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  FileText,
  X,
  Calendar as CalendarIcon,
  Filter
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from "recharts";
import { toast } from "sonner";
import { CHART_COLORS } from "@/constants";
import { useMemo, useState } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StatusDemanda } from "@/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Dashboard utilities
import {
  type DashboardFilters,
  type PeriodoPreset,
  type FiltroPrazo,
  DEFAULT_FILTERS,
  applyDashboardFilters,
  hasActiveFilters,
  resetFilters,
  computeKPIs,
  computeBucketsMensais,
  computeAgrupamentoPorTemplate,
  computeAgrupamentoPorUsuario,
  getUsuariosPorTaxaConclusao,
  formatarNomeUsuario,
} from "@/utils/dashboard";

// Estilo comum para tooltips dos gráficos
const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
  fontSize: "12px",
};

export default function Relatorios() {
  const { demandas, templates, usuarios, getTemplate, getUsuario } = useData();
  
  // Estado dos filtros
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  
  // Estados para calendário (período customizado)
  const [calendarInicioOpen, setCalendarInicioOpen] = useState(false);
  const [calendarFimOpen, setCalendarFimOpen] = useState(false);

  // Demandas filtradas
  const demandasFiltradas = useMemo(() => {
    return applyDashboardFilters(demandas, filters);
  }, [demandas, filters]);

  // KPIs computadas
  const kpis = useMemo(() => {
    return computeKPIs(demandasFiltradas);
  }, [demandasFiltradas]);

  // Dados para gráficos
  const bucketsMensais = useMemo(() => {
    return computeBucketsMensais(demandasFiltradas);
  }, [demandasFiltradas]);

  const agrupamentoPorTemplate = useMemo(() => {
    return computeAgrupamentoPorTemplate(demandasFiltradas, templates);
  }, [demandasFiltradas, templates]);

  const agrupamentoPorUsuario = useMemo(() => {
    const agrupamento = computeAgrupamentoPorUsuario(demandasFiltradas, usuarios);
    // Aplicar formatação de nomes
    return agrupamento.map(u => ({
      ...u,
      nome: formatarNomeUsuario(u.nome),
    }));
  }, [demandasFiltradas, usuarios]);

  const usuariosPorTaxa = useMemo(() => {
    return getUsuariosPorTaxaConclusao(agrupamentoPorUsuario);
  }, [agrupamentoPorUsuario]);

  // Handlers de filtros
  const handlePeriodoChange = (value: string) => {
    const newFilters = { 
      ...filters, 
      periodoPreset: value as PeriodoPreset,
      // Limpar datas customizadas se não for custom
      ...(value !== "custom" ? { dataInicio: null, dataFim: null } : {})
    };
    setFilters(newFilters);
  };

  const handleUsuarioChange = (value: string) => {
    setFilters({ ...filters, usuarioId: value === "all" ? null : value });
  };

  const handleTemplateChange = (value: string) => {
    setFilters({ ...filters, templateId: value === "all" ? null : value });
  };

  const handleStatusChange = (value: string) => {
    if (value === "all") {
      setFilters({ ...filters, status: [] });
    } else {
      setFilters({ ...filters, status: [value as StatusDemanda] });
    }
  };

  const handlePrazoChange = (value: string) => {
    setFilters({ ...filters, prazo: value as FiltroPrazo });
  };

  const handleDataInicioChange = (date: Date | undefined) => {
    setFilters({ 
      ...filters, 
      dataInicio: date || null,
      periodoPreset: "custom" 
    });
    setCalendarInicioOpen(false);
  };

  const handleDataFimChange = (date: Date | undefined) => {
    setFilters({ 
      ...filters, 
      dataFim: date || null,
      periodoPreset: "custom" 
    });
    setCalendarFimOpen(false);
  };

  const handleLimparFiltros = () => {
    setFilters(resetFilters());
  };

  // Export CSV
  const handleExportCSV = () => {
    if (demandasFiltradas.length === 0) {
      toast.error("Não há dados para exportar");
      return;
    }

    const csvData = demandasFiltradas.map((demanda) => {
      const template = getTemplate(demanda.template_id);
      const usuario = getUsuario(demanda.responsavel_id);
      const tempoEmDias = demanda.data_finalizacao
        ? Math.ceil((new Date(demanda.data_finalizacao).getTime() - new Date(demanda.data_criacao).getTime()) / (1000 * 60 * 60 * 24))
        : "";
      
      return {
        ID: demanda.id,
        Nome: demanda.nome_demanda,
        Template: template?.nome || "",
        Status: demanda.status,
        Responsável: usuario?.nome || "",
        "Data Criação": format(new Date(demanda.data_criacao), "dd/MM/yyyy", { locale: ptBR }),
        "Data Previsão": format(new Date(demanda.data_previsao), "dd/MM/yyyy", { locale: ptBR }),
        "Data Finalização": demanda.data_finalizacao 
          ? format(new Date(demanda.data_finalizacao), "dd/MM/yyyy", { locale: ptBR })
          : "",
        "Tempo (dias)": tempoEmDias,
        Prazo: demanda.prazo ? "Dentro do prazo" : "Em atraso",
      };
    });

    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData.map((row) => 
      Object.values(row).map(val => `"${val}"`).join(",")
    );
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-demandas-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Relatório exportado com sucesso!");
  };

  const filtrosAtivos = hasActiveFilters(filters);

  return (
    <div className="h-full flex flex-col">
      {/* Header com título e ações */}
      <div className="p-4 sm:p-6 border-b bg-card">
        <div className="flex flex-col gap-4">
          {/* Título e botão de export */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard de Relatórios</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Métricas, gráficos e análises de demandas
              </p>
            </div>
            <Button onClick={handleExportCSV} size="lg" className="gap-2 w-full sm:w-auto">
              <Download className="w-5 h-5" />
              <span>Exportar CSV</span>
            </Button>
          </div>

          {/* Filtros */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
            </div>
            
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {/* Período */}
              <Select value={filters.periodoPreset} onValueChange={handlePeriodoChange}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Últimos 3 meses</SelectItem>
                  <SelectItem value="6">Últimos 6 meses</SelectItem>
                  <SelectItem value="12">Últimos 12 meses</SelectItem>
                  <SelectItem value="all">Todo o período</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>

              {/* Data início (período customizado) */}
              {filters.periodoPreset === "custom" && (
                <>
                  <Popover open={calendarInicioOpen} onOpenChange={setCalendarInicioOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full sm:w-[140px] justify-start text-left font-normal",
                          !filters.dataInicio && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dataInicio ? format(filters.dataInicio, "dd/MM/yyyy") : "Data início"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dataInicio || undefined}
                        onSelect={handleDataInicioChange}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover open={calendarFimOpen} onOpenChange={setCalendarFimOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full sm:w-[140px] justify-start text-left font-normal",
                          !filters.dataFim && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dataFim ? format(filters.dataFim, "dd/MM/yyyy") : "Data fim"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dataFim || undefined}
                        onSelect={handleDataFimChange}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </>
              )}

              {/* Usuário */}
              <Select 
                value={filters.usuarioId || "all"} 
                onValueChange={handleUsuarioChange}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Template/Tipo */}
              <Select 
                value={filters.templateId || "all"} 
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status */}
              <Select 
                value={filters.status.length === 0 ? "all" : filters.status[0]} 
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value={StatusDemanda.CRIADA}>Criada</SelectItem>
                  <SelectItem value={StatusDemanda.EM_ANDAMENTO}>Em Andamento</SelectItem>
                  <SelectItem value={StatusDemanda.FINALIZADA}>Finalizada</SelectItem>
                </SelectContent>
              </Select>

              {/* Prazo */}
              <Select value={filters.prazo} onValueChange={handlePrazoChange}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Prazo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="dentro">Dentro do prazo</SelectItem>
                  <SelectItem value="atrasado">Em atraso</SelectItem>
                </SelectContent>
              </Select>

              {/* Limpar filtros */}
              {filtrosAtivos && (
                <Button
                  variant="outline"
                  onClick={handleLimparFiltros}
                  className="gap-2 w-full sm:w-auto"
                >
                  <X className="w-4 h-4" />
                  <span>Limpar</span>
                </Button>
              )}
            </div>

            {/* Indicador de resultados */}
            {filtrosAtivos && (
              <div className="text-sm text-muted-foreground">
                Mostrando <span className="font-medium text-foreground">{demandasFiltradas.length}</span> de{" "}
                <span className="font-medium text-foreground">{demandas.length}</span> demandas
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo do Dashboard */}
      <div className="flex-1 p-4 sm:p-6 overflow-auto space-y-4 sm:space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Criadas</p>
                <p className="text-2xl font-bold">{kpis.total}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground/50" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Não Iniciadas</p>
                <p className="text-2xl font-bold text-primary">{kpis.criadas}</p>
              </div>
              <FileText className="w-8 h-8 text-primary/50" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Em Andamento</p>
                <p className="text-2xl font-bold text-warning">{kpis.emAndamento}</p>
              </div>
              <Clock className="w-8 h-8 text-warning/50" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Finalizadas</p>
                <p className="text-2xl font-bold text-success">{kpis.finalizadas}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-success/50" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Taxa Conclusão no Prazo</p>
                <p className="text-2xl font-bold text-success">{kpis.taxaConclusaoNoPrazo}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success/50" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Em Atraso</p>
                <p className="text-2xl font-bold text-destructive">{kpis.emAtraso}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive/50" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Tempo Médio</p>
                <p className="text-2xl font-bold">{kpis.tempoMedioConclusao}d</p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground/50" />
            </div>
          </Card>
        </div>

        {/* Gráficos - Primeira linha */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Gráfico de Barras - Por Mês */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Demandas por Mês</h3>
            {bucketsMensais.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={bucketsMensais} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="criadas" fill="hsl(217, 91%, 60%)" name="Criadas" />
                  <Bar dataKey="emAndamento" fill="hsl(45, 93%, 47%)" name="Em Andamento" />
                  <Bar dataKey="concluidas" fill="hsl(142, 71%, 45%)" name="Concluídas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível para o período
              </div>
            )}
          </Card>

          {/* Gráfico de Pizza - Por Tipo */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Distribuição por Tipo</h3>
            {agrupamentoPorTemplate.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={agrupamentoPorTemplate}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ nome, percent }) => `${nome}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {agrupamentoPorTemplate.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={tooltipStyle}
                    formatter={(value, _, props) => [`${value} demandas`, props.payload.nome]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </Card>
        </div>

        {/* Gráficos - Segunda linha */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Gráfico de Barras Horizontal - Por Usuário */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Demandas por Usuário</h3>
            {agrupamentoPorUsuario.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart 
                  data={agrupamentoPorUsuario} 
                  layout="vertical" 
                  margin={{ top: 5, right: 10, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis 
                    dataKey="nome" 
                    type="category" 
                    tick={{ fontSize: 11 }} 
                    width={75}
                  />
                  <Tooltip 
                    contentStyle={tooltipStyle}
                    formatter={(value, _, props) => [
                      `${value} demandas`,
                      "Total"
                    ]}
                  />
                  <Bar dataKey="total" fill="hsl(217, 91%, 60%)" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </Card>

          {/* Quantidade por Tipo */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Quantidade por Tipo de Demanda</h3>
            {agrupamentoPorTemplate.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart 
                  data={agrupamentoPorTemplate} 
                  margin={{ top: 5, right: 10, left: -20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="nome" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="total" fill="hsl(217, 91%, 60%)" name="Total" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </Card>
        </div>

        {/* Gráficos - Terceira linha */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Taxa Conclusão no Prazo por Usuário */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-4">Taxa Conclusão no Prazo por Usuário</h3>
            {usuariosPorTaxa.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart 
                  data={usuariosPorTaxa} 
                  margin={{ top: 5, right: 10, left: -20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="nome" 
                    tick={{ fontSize: 11 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={tooltipStyle}
                    formatter={(value, _, props) => [
                      `${value}% (${props.payload.finalizadasNoPrazo}/${props.payload.finalizadas} no prazo)`,
                      "Taxa"
                    ]}
                  />
                  <Bar dataKey="taxaConclusaoNoPrazo" fill="hsl(142, 71%, 45%)" name="Taxa (%)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
