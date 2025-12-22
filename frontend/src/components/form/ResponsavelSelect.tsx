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
  const { usuarios, cargos } = useData();
  const selectValue = value || "";

  // Fase 4: filtrar usuários e cargos conforme flags do cargo
  const usuariosElegiveis = usuarios.filter((u) => u.cargo?.usuarios_disponiveis_como_responsaveis === true);
  const usuariosFiltrados = defaultResponsavelId
    ? usuariosElegiveis.filter((u) => u.id !== defaultResponsavelId)
    : usuariosElegiveis;

  const cargosElegiveis = cargos.filter((c) => c.cargo_disponivel_como_responsavel === true);

  return (
    <Select value={selectValue} onValueChange={onValueChange}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {defaultResponsavelId && (
          <SelectGroup>
            <SelectItem value={defaultResponsavelId}>
              Usar padrão ({usuarios.find(u => u.id === defaultResponsavelId)?.nome || "Responsável da demanda"})
            </SelectItem>
          </SelectGroup>
        )}
        {includeCargos && cargosElegiveis.length > 0 && (
          <SelectGroup>
            <SelectLabel>Cargos</SelectLabel>
            {cargosElegiveis.map((cargo) => (
              <SelectItem key={cargo.id} value={cargo.id}>
                {cargo.nome}
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        <SelectGroup>
          <SelectLabel>Usuários</SelectLabel>
          {usuariosFiltrados.map((usuario) => (
            <SelectItem key={usuario.id} value={usuario.id}>
              {usuario.nome}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
});

