/**
 * ResponsavelSelect - Componente reutilizável para seleção de responsável
 * 
 * Combina seleção de cargos e usuários em um único Select,
 * com suporte opcional para destacar o responsável padrão
 */

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

export const ResponsavelSelect = ({
  value,
  onValueChange,
  placeholder = "Selecione um responsável",
  defaultResponsavelId,
  triggerClassName,
  includeCargos = true,
}: ResponsavelSelectProps) => {
  const { usuarios, cargos } = useData();

  const usuariosElegiveis = usuarios.filter((u) => u.cargo?.usuarios_disponiveis_como_responsaveis === true);
  const cargosElegiveis = cargos.filter((c) => c.cargo_disponivel_como_responsavel === true);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
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
          {usuariosElegiveis.map((usuario) => (
            <SelectItem key={usuario.id} value={usuario.id}>
              {usuario.nome}
              {defaultResponsavelId && usuario.id === defaultResponsavelId && " (Padrão)"}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

