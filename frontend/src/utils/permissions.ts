import type { CargoPermissionKey, Usuario } from "@/types";

export function hasPermission(user: Usuario | null | undefined, permission: CargoPermissionKey): boolean {
  return user?.cargo?.[permission] === true;
}


