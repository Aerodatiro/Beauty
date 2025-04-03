import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  BarChart2,
  Settings,
  Building,
  LogOut,
  UserCog
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, company, logoutMutation } = useAuth();

  // Navigation items with icons and paths
  const mainNavItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5 mr-3" />,
      path: "/dashboard",
      role: ["admin", "collaborator"],
    },
    {
      title: "Agenda",
      icon: <Calendar className="h-5 w-5 mr-3" />,
      path: "/appointments",
      role: ["admin", "collaborator"],
    },
    {
      title: "Clientes",
      icon: <Users className="h-5 w-5 mr-3" />,
      path: "/clients",
      role: ["admin", "collaborator"],
    },
    {
      title: "Colaboradores",
      icon: <UserCog className="h-5 w-5 mr-3" />,
      path: "/collaborators",
      role: ["admin", "collaborator"],
    },
    {
      title: "Procedimentos",
      icon: <Scissors className="h-5 w-5 mr-3" />,
      path: "/procedures",
      role: ["admin"],
    },
    {
      title: "Financeiro",
      icon: <BarChart2 className="h-5 w-5 mr-3" />,
      path: "/finance",
      role: ["admin"],
    },
  ];

  const settingsNavItems = [
    {
      title: "Perfil",
      icon: <Settings className="h-5 w-5 mr-3" />,
      path: "/profile",
      role: ["admin", "collaborator"],
    },
    {
      title: "Empresa",
      icon: <Building className="h-5 w-5 mr-3" />,
      path: "/company",
      role: ["admin"],
    },
  ];

  // Filter navigation items based on user role
  const filteredMainNavItems = mainNavItems.filter(item => 
    user?.role && item.role.includes(user.role)
  );
  
  const filteredSettingsNavItems = settingsNavItems.filter(item => 
    user?.role && item.role.includes(user.role)
  );

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Get user's first name for avatar fallback
  const getInitials = () => {
    if (!user || !user.name) return "U";
    const names = user.name.split(" ");
    if (names.length === 1) return names[0].charAt(0);
    return names[0].charAt(0) + names[names.length - 1].charAt(0);
  };

  // Renderiza um item de navegação com o estilo apropriado
  const renderNavItem = (item: {
    title: string;
    icon: React.ReactNode;
    path: string;
    role: string[];
  }) => (
    <li key={item.path}>
      <Link href={item.path}>
        <div className={cn(
          "flex items-center px-4 py-3 text-gray-600 hover:text-primary hover:bg-blue-50 border-l-4 border-transparent hover:border-primary transition-all cursor-pointer",
          location === item.path && "text-primary border-primary bg-blue-50"
        )}>
          {item.icon}
          <span>{item.title}</span>
        </div>
      </Link>
    </li>
  );

  return (
    <aside className="hidden md:block w-64 bg-white border-r border-gray-200 fixed top-0 left-0 bottom-0 z-30">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary">BeautyManager</h1>
        <p className="text-sm text-gray-500 mt-1">{company?.name || "Carregando..."}</p>
      </div>
      
      <nav className="mt-4">
        <div className="px-4 py-2">
          <p className="text-xs text-gray-500 uppercase">Menu Principal</p>
        </div>
        
        <ul>
          {filteredMainNavItems.map(renderNavItem)}
        </ul>
        
        <div className="px-4 py-2 mt-4">
          <p className="text-xs text-gray-500 uppercase">Configurações</p>
        </div>
        
        <ul>
          {filteredSettingsNavItems.map(renderNavItem)}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 w-64 border-t border-gray-200 p-4">
        <div className="flex items-center">
          <Avatar>
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
            <p className="text-xs text-gray-500">
              {user?.role === 'admin' ? 'Administrador' : 'Colaborador'}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="mt-4 w-full flex items-center justify-center"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4 mr-2" /> 
          {logoutMutation.isPending ? "Saindo..." : "Sair"}
        </Button>
      </div>
    </aside>
  );
}
