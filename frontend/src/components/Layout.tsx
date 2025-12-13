import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { LayoutDashboard, FileText, Users, BarChart3, Menu, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Painel de Demandas", href: "/", icon: LayoutDashboard },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Ações", href: "/acoes", icon: Zap },
  { name: "Usuários", href: "/usuarios", icon: Users },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { name: "Finalizadas", href: "/finalizadas", icon: CheckCircle2 },
];

const NavLinks = ({ 
  location, 
  onNavigate 
}: { 
  location: ReturnType<typeof useLocation>; 
  onNavigate?: () => void;
}) => (
  <>
    {navigation.map((item) => {
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Header */}
      <header className="fixed top-0 left-0 right-0 z-40 md:hidden bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-bold text-sidebar-foreground">
            Gestor de Demandas
          </h1>
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
                <NavLinks location={location} onNavigate={() => setMobileMenuOpen(false)} />
              </nav>
            </SheetContent>
          </Sheet>
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
          <NavLinks location={location} />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-[65px] md:pt-0">
        <Outlet />
      </main>
    </div>
  );
};
