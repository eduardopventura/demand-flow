import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { z } from "zod";
import { LogIn, Loader2 } from "lucide-react";
import { error as logError } from "@/utils/logger";

// Schema de validação
const loginSchema = z.object({
  login: z.string().min(1, "Login é obrigatório"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    login: "",
    senha: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [loading, setLoading] = useState(false);

  // Redirecionar se já estiver autenticado
  if (isAuthenticated) {
    navigate("/", { replace: true });
    return null;
  }

  const handleChange = (field: keyof LoginFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Limpar erro do campo ao digitar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validação com Zod
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof LoginFormData] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Tentar fazer login
    setLoading(true);
    try {
      await login(formData.login, formData.senha);
      // Redirecionar após login bem-sucedido
      navigate("/", { replace: true });
    } catch (error) {
      // Erro já é tratado no AuthContext com toast
      logError("Erro no login:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <LogIn className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Gestor de Demandas
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Faça login para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login">Login</Label>
            <Input
              id="login"
              type="text"
              placeholder="Digite seu login"
              value={formData.login}
              onChange={handleChange("login")}
              disabled={loading}
              className={errors.login ? "border-destructive" : ""}
              autoComplete="username"
            />
            {errors.login && (
              <p className="text-sm text-destructive">{errors.login}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              placeholder="Digite sua senha"
              value={formData.senha}
              onChange={handleChange("senha")}
              disabled={loading}
              className={errors.senha ? "border-destructive" : ""}
              autoComplete="current-password"
            />
            {errors.senha && (
              <p className="text-sm text-destructive">{errors.senha}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Entrar
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}

