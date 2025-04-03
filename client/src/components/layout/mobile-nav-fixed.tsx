import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  BarChart2,
  Settings,
  Building,
  LogOut,
  Menu,
  X,
  UserCog,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNav() {
  const [location] = useLocation();
  const { user, company, logoutMutation } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Navigation items with icons and paths
  const mainNavItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: "/dashboard",
      role: ["admin", "collaborator"],
    },
    {
      title: "Agenda",
      icon: <Calendar className="h-5 w-5" />,
      path: "/appointments",
      role: ["admin", "collaborator"],
    },
    {
      title: "Clientes",
      icon: <Users className="h-5 w-5" />,
      path: "/clients",
      role: ["admin", "collaborator"],
    },
    {
      title: "Colaboradores",
      icon: <UserCog className="h-5 w-5" />,
      path: "/collaborators",
      role: ["admin", "collaborator"],
    },
    {
      title: "Procedimentos",
      icon: <Scissors className="h-5 w-5" />,
      path: "/procedures",
      role: ["admin"],
    },
    {
      title: "Financeiro",
      icon: <BarChart2 className="h-5 w-5" />,
      path: "/finance",
      role: ["admin"],
    },
  ];

  const settingsNavItems = [
    {
      title: "Perfil",
      icon: <Settings className="h-5 w-5" />,
      path: "/profile",
      role: ["admin", "collaborator"],
    },
    {
      title: "Empresa",
      icon: <Building className="h-5 w-5" />,
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

  // Bottom navigation items (mobile)
  const bottomNavItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: "/dashboard",
      role: ["admin", "collaborator"],
    },
    {
      title: "Agenda",
      icon: <Calendar className="h-5 w-5" />,
      path: "/appointments",
      role: ["admin", "collaborator"],
    },
    {
      title: "Clientes",
      icon: <Users className="h-5 w-5" />,
      path: "/clients",
      role: ["admin", "collaborator"],
    },
    {
      title: "Mais",
      icon: <MoreHorizontal className="h-5 w-5" />,
      path: "#",
      role: ["admin", "collaborator"],
      triggerMenu: true,
    },
  ];

  const filteredBottomNavItems = bottomNavItems.filter(item => 
    user?.role && item.role.includes(user.role)
  );

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsOpen(false);
  };

  // Get user's first name for avatar fallback
  const getInitials = () => {
    if (!user || !user.name) return "U";
    const names = user.name.split(" ");
    if (names.length === 1) return names[0].charAt(0);
    return names[0].charAt(0) + names[names.length - 1].charAt(0);
  };

  const handleNavItemClick = (item: any) => {
    if (item.triggerMenu) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between p-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6 text-gray-700" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h1 className="text-xl font-bold text-primary">BeautyManager</h1>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-5 w-5 text-gray-500" />
                </Button>
              </div>
              
              <div className="p-4 border-b border-gray-200">
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
              </div>
              
              <nav className="mt-4">
                <div className="px-4 py-2">
                  <p className="text-xs text-gray-500 uppercase">Menu Principal</p>
                </div>
                
                <ul>
                  {filteredMainNavItems.map((item) => (
                    <li key={item.path}>
                      <div onClick={() => {
                        setIsOpen(false);
                      }}>
                        <Link href={item.path}>
                          <div 
                            className={cn(
                              "flex items-center px-4 py-3 text-gray-600 hover:text-primary hover:bg-blue-50 border-l-4 border-transparent hover:border-primary transition-all",
                              location === item.path && "text-primary border-primary bg-blue-50"
                            )}
                          >
                            {item.icon}
                            <span className="ml-3">{item.title}</span>
                          </div>
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
                
                <div className="px-4 py-2 mt-4">
                  <p className="text-xs text-gray-500 uppercase">Configurações</p>
                </div>
                
                <ul>
                  {filteredSettingsNavItems.map((item) => (
                    <li key={item.path}>
                      <div onClick={() => {
                        setIsOpen(false);
                      }}>
                        <Link href={item.path}>
                          <div 
                            className={cn(
                              "flex items-center px-4 py-3 text-gray-600 hover:text-primary hover:bg-blue-50 border-l-4 border-transparent hover:border-primary transition-all",
                              location === item.path && "text-primary border-primary bg-blue-50"
                            )}
                          >
                            {item.icon}
                            <span className="ml-3">{item.title}</span>
                          </div>
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </nav>
              
              <div className="border-t border-gray-200 p-4 mt-4">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4 mr-2" /> 
                  {logoutMutation.isPending ? "Saindo..." : "Sair"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          
          <h1 className="text-lg font-bold text-primary">BeautyManager</h1>
          
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around">
          {filteredBottomNavItems.map((item) => (
            <div key={item.path} onClick={() => handleNavItemClick(item)}>
              <Link href={item.path}>
                <div
                  className={cn(
                    "flex flex-col items-center p-3 text-gray-500",
                    location === item.path && "text-primary"
                  )}
                >
                  {item.icon}
                  <span className="text-xs mt-1">{item.title}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}