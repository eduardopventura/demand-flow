import { useData } from "@/contexts/DataContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

export default function Relatorios() {
  const { demandas, templates, getTemplate } = useData();

  // Demandas concluídas por mês (simulando dados dos últimos 6 meses)
  const getDemandasPorMes = () => {
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
    const demandasFinalizadas = demandas.filter((d) => d.status === "Finalizada");
    
    return meses.map((mes, index) => ({
      mes,
      concluidas: Math.floor(Math.random() * 5) + demandasFinalizadas.length / 6,
    }));
  };

  // Total de demandas por tipo (template)
  const getDemandasPorTipo = () => {
    const tipos = templates.map((template) => {
      const count = demandas.filter((d) => d.template_id === template.id).length;
      return {
        nome: template.nome,
        total: count,
      };
    });

    return tipos.filter((t) => t.total > 0);
  };

  const handleExportCSV = () => {
    const csvData = demandas.map((demanda) => {
      const template = getTemplate(demanda.template_id);
      return {
        ID: demanda.id,
        Nome: demanda.nome_demanda,
        Template: template?.nome || "",
        Status: demanda.status,
        Prioridade: demanda.prioridade,
      };
    });

    const headers = Object.keys(csvData[0]).join(",");
    const rows = csvData.map((row) => Object.values(row).join(","));
    const csv = [headers, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-demandas-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    toast.success("Relatório exportado com sucesso!");
  };

  const demandasPorMes = getDemandasPorMes();
  const demandasPorTipo = getDemandasPorTipo();

  const COLORS = ["hsl(217, 91%, 60%)", "hsl(142, 71%, 45%)", "hsl(45, 93%, 47%)", "hsl(0, 72%, 51%)"];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 sm:p-6 border-b bg-card">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Visualize estatísticas e exporte dados
            </p>
          </div>
          <Button onClick={handleExportCSV} size="lg" className="gap-2 w-full sm:w-auto">
            <Download className="w-5 h-5" />
            <span>Exportar CSV</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        {/* Estatísticas Gerais - Moved to top for mobile visibility */}
        <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Resumo Geral</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            <div className="text-center sm:text-left">
              <p className="text-muted-foreground text-xs sm:text-sm mb-1">Total de Demandas</p>
              <p className="text-2xl sm:text-3xl font-bold">{demandas.length}</p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-muted-foreground text-xs sm:text-sm mb-1">Criadas</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                {demandas.filter((d) => d.status === "Criada").length}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-muted-foreground text-xs sm:text-sm mb-1">Em Andamento</p>
              <p className="text-2xl sm:text-3xl font-bold text-warning">
                {demandas.filter((d) => d.status === "Em Andamento").length}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-muted-foreground text-xs sm:text-sm mb-1">Finalizadas</p>
              <p className="text-2xl sm:text-3xl font-bold text-success">
                {demandas.filter((d) => d.status === "Finalizada").length}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Gráfico de Barras */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Demandas Concluídas por Mês</h3>
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <BarChart data={demandasPorMes} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" className="text-xs sm:text-sm" tick={{ fontSize: 12 }} />
                <YAxis className="text-xs sm:text-sm" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="concluidas" fill="hsl(217, 91%, 60%)" name="Concluídas" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Gráfico de Pizza */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Total de Demandas por Tipo</h3>
            <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
              <PieChart>
                <Pie
                  data={demandasPorTipo}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {demandasPorTipo.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    fontSize: "12px",
                  }}
                  formatter={(value, _, props) => [value, props.payload.nome]}
                />
                <Legend 
                  wrapperStyle={{ fontSize: "12px" }} 
                  formatter={(_, entry) => entry.payload?.nome || ""}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}
