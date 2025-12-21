import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "@/contexts/DataContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PermissionRoute } from "@/components/PermissionRoute";
import PainelDemandas from "./pages/PainelDemandas";
import Templates from "./pages/Templates";
import Acoes from "./pages/Acoes";
import Usuarios from "./pages/Usuarios";
import Cargos from "./pages/Cargos";
import Relatorios from "./pages/Relatorios";
import Finalizadas from "./pages/Finalizadas";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

/**
 * Componente interno com rotas
 */
const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública de login */}
        <Route path="/login" element={<Login />} />
        
        {/* Rotas protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PainelDemandas />} />
          <Route
            path="templates"
            element={
              <PermissionRoute permission="acesso_templates">
                <Templates />
              </PermissionRoute>
            }
          />
          <Route
            path="acoes"
            element={
              <PermissionRoute permission="acesso_acoes">
                <Acoes />
              </PermissionRoute>
            }
          />
          <Route
            path="usuarios"
            element={
              <PermissionRoute permission="acesso_usuarios">
                <Usuarios />
              </PermissionRoute>
            }
          />
          <Route
            path="cargos"
            element={
              <PermissionRoute permission="acesso_usuarios">
                <Cargos />
              </PermissionRoute>
            }
          />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="finalizadas" element={<Finalizadas />} />
        </Route>
        
        {/* Rota 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <DataProvider>
            <AppRoutes />
          </DataProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
