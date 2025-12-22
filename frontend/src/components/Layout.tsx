import { useState } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, Users, BarChart3, Menu, Zap, CheckCircle2, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/utils/permissions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

function buildNavigation(user: ReturnType<typeof useAuth>["user"]) {
  const items: Array<{ name: string; href: string; icon: any }> = [
    { name: "Painel de Demandas", href: "/", icon: LayoutDashboard },
  ];

  if (hasPermission(user, "acesso_templates")) items.push({ name: "Templates", href: "/templates", icon: FileText });
  if (hasPermission(user, "acesso_acoes")) items.push({ name: "Ações", href: "/acoes", icon: Zap });
  if (hasPermission(user, "acesso_usuarios")) items.push({ name: "Usuários", href: "/usuarios", icon: Users });

  items.push({ name: "Relatórios", href: "/relatorios", icon: BarChart3 });
  items.push({ name: "Finalizadas", href: "/finalizadas", icon: CheckCircle2 });

  return items;
}

const NavLinks = ({
  location, 
  items,
  onNavigate 
}: { 
  location: ReturnType<typeof useLocation>; 
  items: Array<{ name: string; href: string; icon: any }>;
  onNavigate?: () => void;
}) => (
  <>
    {items.map((item) => {
      const isActive = location.pathname === item.href;
      return (
        <Link
          key={item.name}
          to={item.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
            isActive
              ? "bg-sidebar-accent text-sidebar-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
          )}
        >
          <item.icon className="w-5 h-5" />
          <span className="font-medium">{item.name}</span>
        </Link>
      );
    })}
  </>
);

export const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigation = buildNavigation(user);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-40 md:hidden bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-bold text-sidebar-foreground">
            Gestor de Demandas
          </h1>
          <div className="flex items-center gap-2">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-sidebar-foreground">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Menu do usuário</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.nome}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-sidebar-foreground">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-sidebar border-sidebar-border p-0">
                <SheetHeader className="p-6 border-b border-sidebar-border">
                  <SheetTitle className="text-xl font-bold text-sidebar-foreground text-left">
                    Gestor de Demandas
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex-1 p-4 space-y-1">
                  <NavLinks location={location} items={navigation} onNavigate={() => setMobileMenuOpen(false)} />
                </nav>
                {user && (
                  <div className="p-4 border-t border-sidebar-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-sidebar-foreground" />
                        <div className="flex flex-col">
                          <p className="text-sm font-medium text-sidebar-foreground">{user.nome}</p>
                          <p className="text-xs text-muted-foreground">{user.email || "-"}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleLogout}
                        className="text-sidebar-foreground"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="sr-only">Sair</span>
                      </Button>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-sidebar border-r border-sidebar-border flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold text-sidebar-foreground">
            Gestor de Demandas
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLinks location={location} items={navigation} />
        </nav>
        {user && (
          <div className="p-4 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
                >
                  <User className="mr-2 h-4 w-4" />
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <p className="text-sm font-medium truncate w-full">{user.nome}</p>
                    <p className="text-xs text-muted-foreground truncate w-full">{user.email}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.nome}</p>
                    <p className="text-xs text-muted-foreground">{user.email || "-"}</p>
                    {user.cargo?.nome && (
                      <p className="text-xs text-muted-foreground">{user.cargo.nome}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-[65px] md:pt-0">
        <Outlet />
      </main>
    </div>
  );
};
