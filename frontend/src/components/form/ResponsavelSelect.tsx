/**
 * ResponsavelSelect - Componente reutilizável para seleção de responsável
 * 
 * Combina seleção de cargos e usuários em um único Select,
 * com suporte opcional para destacar o responsável padrão
 */

import { memo } from "react";
import { useData } from "@/contexts/DataContext";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Cargo, CargoLabels } from "@/types";

interface ResponsavelSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  /** ID do responsável padrão (será destacado com "(Padrão)") */
  defaultResponsavelId?: string;
  /** Altura do trigger */
  triggerClassName?: string;
  /** Se deve incluir cargos na lista */
  includeCargos?: boolean;
}

export const ResponsavelSelect = memo(function ResponsavelSelect({
  value,
  onValueChange,
  placeholder = "Selecione um responsável",
  defaultResponsavelId,
  triggerClassName,
  includeCargos = true,
}: ResponsavelSelectProps) {
  const { usuarios } = useData();

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeCargos && (
          <SelectGroup>
            <SelectLabel>Cargos</SelectLabel>
            {Object.values(Cargo).map((cargo) => (
              <SelectItem key={cargo} value={cargo}>
                {CargoLabels[cargo]}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        <SelectGroup>
          <SelectLabel>Usuários</SelectLabel>
          {usuarios.map((usuario) => (
            <SelectItem key={usuario.id} value={usuario.id}>
              {usuario.nome}
              {defaultResponsavelId && usuario.id === defaultResponsavelId && " (Padrão)"}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
});

