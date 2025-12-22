import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/utils/permissions";
import type { CargoPermissionKey } from "@/types";

interface PermissionRouteProps {
  permission: CargoPermissionKey;
  children: React.ReactNode;
}

/**
 * PermissionRoute - protege rotas por permissão de cargo
 *
 * Regra (Fase 4): sem permissão => redirecionar para "/"
 */
export const PermissionRoute: React.FC<PermissionRouteProps> = ({ permission, children }) => {
  const { user } = useAuth();

  if (!hasPermission(user, permission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};


