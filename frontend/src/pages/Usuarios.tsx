import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Mail, User, Phone, Bell, BellOff, Shield } from "lucide-react";
import { toast } from "sonner";
import type { Usuario } from "@/types";
import { Cargo, CargoLabels } from "@/types";

export default function Usuarios() {
  const { usuarios, addUsuario, updateUsuario, deleteUsuario } = useData();
  const [modalOpen, setModalOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    login: "",
    senha: "",
    notificar_email: false,
    notificar_telefone: false,
    cargo: "" as Cargo | "",
  });

  const handleOpenModal = (usuario?: Usuario) => {
    if (usuario) {
      setUsuarioEditando(usuario);
      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone || "",
        login: usuario.login,
        senha: usuario.senha,
        notificar_email: usuario.notificar_email || false,
        notificar_telefone: usuario.notificar_telefone || false,
        cargo: usuario.cargo || "",
      });
    } else {
      setUsuarioEditando(null);
      setFormData({ 
        nome: "", 
        email: "", 
        telefone: "",
        login: "", 
        senha: "",
        notificar_email: false,
        notificar_telefone: false,
        cargo: "",
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.nome || !formData.email || !formData.login || !formData.senha) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (usuarioEditando) {
      updateUsuario(usuarioEditando.id, formData);
      toast.success("Usuário atualizado com sucesso!");
    } else {
      addUsuario(formData);
      toast.success("Usuário criado com sucesso!");
    }

    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      deleteUsuario(id);
      toast.success("Usuário excluído com sucesso!");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 sm:p-6 border-b bg-card">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Usuários</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Gerencie os usuários do sistema</p>
          </div>
          <Button onClick={() => handleOpenModal()} size="lg" className="gap-2 w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            <span>Novo Usuário</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {usuarios.map((usuario) => (
            <Card key={usuario.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{usuario.nome}</h3>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{usuario.email}</span>
                    {usuario.notificar_email && <Bell className="w-3 h-3 text-green-500" />}
                  </div>
                  {usuario.telefone && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{usuario.telefone}</span>
                      {usuario.notificar_telefone && <Bell className="w-3 h-3 text-green-500" />}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>@{usuario.login}</span>
                  </div>
                  {usuario.cargo && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <Shield className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {CargoLabels[usuario.cargo as Cargo] || usuario.cargo}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleOpenModal(usuario)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(usuario.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {usuarios.length === 0 && (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
              Nenhum usuário cadastrado
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Notificações</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.nome}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>{usuario.telefone || "-"}</TableCell>
                  <TableCell>{usuario.login}</TableCell>
                  <TableCell>
                    {usuario.cargo ? (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {CargoLabels[usuario.cargo as Cargo] || usuario.cargo}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {usuario.notificar_email && (
                        <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          <Mail className="w-3 h-3" /> Email
                        </span>
                      )}
                      {usuario.notificar_telefone && (
                        <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                          <Phone className="w-3 h-3" /> WhatsApp
                        </span>
                      )}
                      {!usuario.notificar_email && !usuario.notificar_telefone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <BellOff className="w-3 h-3" /> Desativadas
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(usuario)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(usuario.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {usuarios.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum usuário cadastrado
            </div>
          )}
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {usuarioEditando ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  className="flex-1"
                />
                <div className="flex items-center gap-2 px-3 border rounded-md bg-muted/30">
                  <Checkbox
                    id="notificar_email"
                    checked={formData.notificar_email}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, notificar_email: checked as boolean })
                    }
                  />
                  <Label htmlFor="notificar_email" className="text-xs cursor-pointer whitespace-nowrap">
                    Notificar
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Telefone (WhatsApp)</Label>
              <div className="flex gap-2">
                <Input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => {
                    // Remove tudo que não é número
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, telefone: value });
                  }}
                  placeholder="5561999999999"
                  className="flex-1"
                />
                <div className="flex items-center gap-2 px-3 border rounded-md bg-muted/30">
                  <Checkbox
                    id="notificar_telefone"
                    checked={formData.notificar_telefone}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, notificar_telefone: checked as boolean })
                    }
                  />
                  <Label htmlFor="notificar_telefone" className="text-xs cursor-pointer whitespace-nowrap">
                    Notificar
                  </Label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Formato: código do país + DDD + número (ex: 5561999999999)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Login</Label>
              <Input
                value={formData.login}
                onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                placeholder="login"
              />
            </div>

            <div className="space-y-2">
              <Label>Senha</Label>
              <Input
                type="password"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                placeholder="••••••"
              />
            </div>

            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select
                value={formData.cargo}
                onValueChange={(v) => setFormData({ ...formData, cargo: v as Cargo })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Cargo).map((cargo) => (
                    <SelectItem key={cargo} value={cargo}>
                      {CargoLabels[cargo]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {usuarioEditando ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
