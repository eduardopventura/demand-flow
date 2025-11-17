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
      <div className="p-6 border-b bg-card">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
            <p className="text-muted-foreground mt-1">
              Visualize estatísticas e exporte dados
            </p>
          </div>
          <Button onClick={handleExportCSV} size="lg" className="gap-2">
            <Download className="w-5 h-5" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Barras */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-6">Demandas Concluídas por Mês</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={demandasPorMes}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" className="text-sm" />
                <YAxis className="text-sm" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Legend />
                <Bar dataKey="concluidas" fill="hsl(217, 91%, 60%)" name="Concluídas" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Gráfico de Pizza */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-6">Total de Demandas por Tipo</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={demandasPorTipo}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nome, percent }) => `${nome} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {demandasPorTipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Estatísticas Gerais */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-xl font-semibold mb-6">Resumo Geral</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total de Demandas</p>
                <p className="text-3xl font-bold">{demandas.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">Criadas</p>
                <p className="text-3xl font-bold text-primary">
                  {demandas.filter((d) => d.status === "Criada").length}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">Em Andamento</p>
                <p className="text-3xl font-bold text-warning">
                  {demandas.filter((d) => d.status === "Em Andamento").length}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">Finalizadas</p>
                <p className="text-3xl font-bold text-success">
                  {demandas.filter((d) => d.status === "Finalizada").length}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
