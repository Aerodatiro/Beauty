import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import StatsCard from "@/components/dashboard/stats-card";
import RevenueChart from "@/components/dashboard/revenue-chart";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarCheck,
  Users,
  DollarSign,
  BarChart2,
  Clock,
  UserRound,
  Calendar
} from "lucide-react";
import { Link } from "wouter";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Define types for dashboard stats and appointments
interface DashboardStats {
  appointments: number;
  clients: number;
  revenue: number;
  occupation: number;
  clientsServed: number;
  weeklyAppointments: number;
}

interface Appointment {
  id: number;
  date: string;
  status: string;
  client?: {
    id: number;
    name: string;
  };
  procedure?: {
    id: number;
    name: string;
  };
  collaborator?: {
    id: number;
    name: string;
  };
}

interface Client {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, company } = useAuth();
  const [timeFilter, setTimeFilter] = useState("day");
  const isAdmin = user?.role === "admin";

  // Fetch dashboard stats
  const { data: stats, isLoading: isStatsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", { timeFilter }],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Fetch today's appointments
  const { data: todayAppointments, isLoading: isAppointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", { 
      startDate: new Date().toISOString().split('T')[0], 
      endDate: new Date().toISOString().split('T')[0],
      collaboratorId: !isAdmin ? user?.id : undefined
    }],
  });

  // Fetch recent clients (only for admin)
  const { data: clients, isLoading: isClientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: isAdmin, // Only fetch for admin users
  });

  // Sort clients by creation date to get most recent
  const recentClients = clients ? 
    [...clients].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5) : 
    [];

  const today = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR });
  const currentDate = today.charAt(0).toUpperCase() + today.slice(1);

  // Get time filter label
  const getFilterLabel = () => {
    switch(timeFilter) {
      case "day": return "Hoje";
      case "week": return "Esta semana";
      case "month": return "Este mês";
      case "year": return "Este ano";
      default: return "Hoje";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex">
      <Sidebar />
      <MobileNav />
      
      <div className="flex-1 md:ml-64 pt-4 md:pt-0">
        <div className="md:p-8 p-4 pt-16 md:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-neutral-800">Dashboard</h2>
              <p className="text-neutral-500">
                {isAdmin 
                  ? "Visão geral da sua empresa" 
                  : "Acompanhe seus atendimentos e agenda"}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-sm text-neutral-500 mb-1">Hoje</p>
              <div className="text-lg font-semibold text-neutral-800">
                {currentDate}
              </div>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard 
              title="Agendamentos" 
              value={stats?.appointments || 0} 
              subtitle={getFilterLabel()}
              icon={<CalendarCheck className="h-5 w-5" />}
              trend={{ value: 8, label: "vs. período anterior" }}
              isLoading={isStatsLoading}
            />
            
            {isAdmin ? (
              <StatsCard 
                title="Clientes" 
                value={stats?.clients || 0} 
                subtitle="Cadastrados"
                icon={<Users className="h-5 w-5" />}
                trend={{ value: 12, label: "vs. mês passado" }}
                isLoading={isStatsLoading}
              />
            ) : (
              <StatsCard 
                title="Clientes Atendidos" 
                value={stats?.clientsServed || 0} 
                subtitle={getFilterLabel()}
                icon={<Users className="h-5 w-5" />}
                trend={{ value: 5, label: "vs. período anterior" }}
                isLoading={isStatsLoading}
              />
            )}
            
            {isAdmin && (
              <StatsCard 
                title="Faturamento" 
                value={`R$ ${stats?.revenue || 0}`} 
                subtitle={getFilterLabel()}
                icon={<DollarSign className="h-5 w-5" />}
                trend={{ value: 5.3, label: "vs. período anterior" }}
                isLoading={isStatsLoading}
              />
            )}
            
            <StatsCard 
              title="Taxa de Ocupação" 
              value={`${stats?.occupation || 0}%`} 
              subtitle="Média do período"
              icon={<BarChart2 className="h-5 w-5" />}
              trend={{ value: -3, label: "vs. período anterior" }}
              isLoading={isStatsLoading}
            />

            {/* Add a fourth card for collaborators to keep the grid consistent */}
            {!isAdmin && (
              <StatsCard 
                title="Agenda da Semana" 
                value={stats?.weeklyAppointments || 0} 
                subtitle="Próximos 7 dias"
                icon={<Calendar className="h-5 w-5" />}
                trend={{ value: 2, label: "vs. semana anterior" }}
                isLoading={isStatsLoading}
              />
            )}
          </div>

          {/* Time filter selector for stats (visible to all users) */}
          <div className="mb-6">
            <div className="flex items-center justify-end">
              <div className="text-sm text-neutral-500 mr-2">Filtrar por:</div>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Hoje</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                  <SelectItem value="year">Este ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Today's Agenda */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle>Agenda de Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                {isAppointmentsLoading ? (
                  <div className="py-6 flex items-center justify-center">
                    <Clock className="h-8 w-8 animate-spin text-gray-300" />
                  </div>
                ) : todayAppointments && todayAppointments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {todayAppointments.map((appointment: any) => (
                      <div key={appointment.id} className="flex items-center justify-between py-3 px-4 border border-neutral-100 rounded-lg hover:bg-neutral-50 transition-colors">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-primary font-medium">
                            {format(new Date(appointment.date), "kk'h'")}
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-neutral-800">{appointment.client?.name || 'Cliente'}</p>
                            <p className="text-sm text-neutral-500">{appointment.procedure?.name || 'Serviço'}</p>
                          </div>
                        </div>
                        <div>
                          <span className="px-3 py-1 bg-blue-100 text-primary text-xs rounded-full">
                            {appointment.collaborator?.name || 'Colaborador'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-gray-500">
                    Nenhum agendamento para hoje
                  </div>
                )}
                
                <div className="p-3 border-t border-neutral-100 mt-3">
                  <Link href="/appointments" className="text-primary text-sm flex items-center justify-center hover:underline">
                    Ver todos os agendamentos <span className="ml-1">→</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Revenue Chart - only visible to admins */}
          {isAdmin && <RevenueChart />}
        </div>
      </div>
    </div>
  );
}
