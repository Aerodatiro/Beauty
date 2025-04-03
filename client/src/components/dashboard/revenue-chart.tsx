import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { format, subDays, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, subQuarters } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, ChevronRight, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CollaboratorTicket {
  id: number;
  name: string;
  appointments: number;
  totalRevenue: number;
  averageTicket: number;
}

export default function RevenueChart() {
  const [timeRange, setTimeRange] = useState("month");
  const [showCollaboratorStats, setShowCollaboratorStats] = useState(false);
  
  // Calculate date range based on selected time range
  const calculateDateRange = () => {
    const now = new Date();
    let startDate: Date, endDate: Date;
    
    switch (timeRange) {
      case "week":
        startDate = startOfWeek(now, { locale: ptBR });
        endDate = endOfWeek(now, { locale: ptBR });
        break;
      case "lastWeek":
        startDate = startOfWeek(subWeeks(now, 1), { locale: ptBR });
        endDate = endOfWeek(subWeeks(now, 1), { locale: ptBR });
        break;
      case "month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "lastMonth":
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case "quarter":
        startDate = startOfQuarter(now);
        endDate = endOfQuarter(now);
        break;
      case "lastQuarter":
        startDate = startOfQuarter(subQuarters(now, 1));
        endDate = endOfQuarter(subQuarters(now, 1));
        break;
      case "custom30":
      default:
        startDate = subDays(now, 30);
        endDate = now;
    }
    
    return {
      startDate,
      endDate
    };
  };
  
  const { startDate, endDate } = calculateDateRange();
  
  interface FinancialRecord {
    id: number;
    type: string;
    category: string;
    description: string;
    value: string | number;
    date: string;
    companyId: number;
    appointmentId?: number;
  }
  
  interface Collaborator {
    id: number;
    name: string;
    email: string;
    role: string;
    function?: string;
    companyId: number;
  }
  
  interface AppointmentData {
    id: number;
    date: string;
    status: string;
    clientId: number;
    collaboratorId: number;
    procedureId: number;
    value: string | number;
    companyId: number;
    client?: { name: string };
    collaborator?: { name: string };
    procedure?: { name: string };
  }
  
  // Fetch financial records for the chart
  const { 
    data: financialRecords, 
    isLoading 
  } = useQuery<FinancialRecord[]>({
    queryKey: ["/api/financial-records", { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    }],
  });
  
  // Fetch collaborators
  const { data: collaborators } = useQuery<Collaborator[]>({
    queryKey: ["/api/collaborators"],
  });
  
  // Fetch all appointments for the period
  const { data: appointments } = useQuery<AppointmentData[]>({
    queryKey: ["/api/appointments", { 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    }],
  });
  
  // Format time range for display
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "week": return "Esta Semana";
      case "lastWeek": return "Semana Passada";
      case "month": return "Este Mês";
      case "lastMonth": return "Mês Passado";
      case "quarter": return "Este Trimestre";
      case "lastQuarter": return "Trimestre Passado";
      case "custom30": return "Últimos 30 dias";
      default: return "Período Selecionado";
    }
  };
  
  // Prepare chart data
  const prepareChartData = () => {
    if (!financialRecords) return [];
    
    // Group records by date
    const recordsByDate = financialRecords.reduce((acc: any, record: any) => {
      const date = format(new Date(record.date), 'dd/MM');
      
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0 };
      }
      
      if (record.type === 'income') {
        acc[date].income += Number(record.value);
      } else if (record.type === 'expense') {
        acc[date].expense += Number(record.value);
      }
      
      return acc;
    }, {});
    
    // Convert to array and sort by date
    return Object.values(recordsByDate).sort((a: any, b: any) => {
      const [dayA, monthA] = a.date.split('/').map(Number);
      const [dayB, monthB] = b.date.split('/').map(Number);
      
      if (monthA !== monthB) return monthA - monthB;
      return dayA - dayB;
    });
  };
  
  const chartData = prepareChartData();
  
  // Calculate performance summary
  const calculatePerformance = () => {
    if (!financialRecords) return { totalRevenue: 0, appointments: 0, averageTicket: 0 };
    
    const incomeRecords = financialRecords.filter((record: any) => record.type === 'income');
    const appointmentRecords = incomeRecords.filter((record: any) => record.category === 'appointment');
    const appointmentsCount = appointmentRecords.length;
    
    const totalRevenue = incomeRecords.reduce((sum: number, record: any) => sum + Number(record.value), 0);
    const averageTicket = appointmentsCount > 0 ? totalRevenue / appointmentsCount : 0;
    
    return {
      totalRevenue,
      appointments: appointmentsCount,
      averageTicket
    };
  };
  
  // Calculate stats per collaborator
  const calculateCollaboratorStats = (): CollaboratorTicket[] => {
    if (!appointments || !collaborators) return [];
    
    const stats: { [key: number]: CollaboratorTicket } = {};
    
    // Initialize stats for all collaborators
    collaborators.forEach((collab: any) => {
      stats[collab.id] = {
        id: collab.id,
        name: collab.name,
        appointments: 0,
        totalRevenue: 0,
        averageTicket: 0
      };
    });
    
    // Process appointments
    appointments.forEach((apt: any) => {
      const collabId = apt.collaboratorId;
      if (stats[collabId]) {
        stats[collabId].appointments += 1;
        stats[collabId].totalRevenue += Number(apt.value);
      }
    });
    
    // Calculate average ticket
    Object.values(stats).forEach(stat => {
      if (stat.appointments > 0) {
        stat.averageTicket = stat.totalRevenue / stat.appointments;
      }
    });
    
    return Object.values(stats).sort((a, b) => b.totalRevenue - a.totalRevenue);
  };
  
  const performance = calculatePerformance();
  const collaboratorStats = calculateCollaboratorStats();
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Desempenho Financeiro</CardTitle>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="lastWeek">Semana Passada</SelectItem>
            <SelectItem value="month">Este Mês</SelectItem>
            <SelectItem value="lastMonth">Mês Passado</SelectItem>
            <SelectItem value="quarter">Este Trimestre</SelectItem>
            <SelectItem value="lastQuarter">Trimestre Passado</SelectItem>
            <SelectItem value="custom30">Últimos 30 Dias</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-neutral-100 rounded-lg p-4">
            <p className="text-sm text-neutral-500">Faturamento Total</p>
            <h4 className="text-xl font-bold text-neutral-800 mt-1">
              R$ {performance.totalRevenue.toFixed(2)}
            </h4>
            <p className="text-xs text-neutral-500 flex items-center mt-2">
              {getTimeRangeLabel()}
            </p>
          </div>
          <div className="bg-neutral-100 rounded-lg p-4">
            <p className="text-sm text-neutral-500">Atendimentos</p>
            <h4 className="text-xl font-bold text-neutral-800 mt-1">
              {performance.appointments}
            </h4>
            <p className="text-xs text-neutral-500 flex items-center mt-2">
              {getTimeRangeLabel()}
            </p>
          </div>
          
          <Dialog open={showCollaboratorStats} onOpenChange={setShowCollaboratorStats}>
            <DialogTrigger asChild>
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4 cursor-pointer hover:bg-primary/10 transition-colors shadow-sm">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-primary/80">Desempenho por Colaborador</p>
                  <ChevronRight className="h-4 w-4 text-primary/60" />
                </div>
                <p className="text-xs text-neutral-500 mt-1 mb-1">
                  Analise métricas detalhadas por profissional
                </p>
                <div className="flex items-center mt-2 justify-between">
                  <div className="flex items-center">
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                      Ticket Médio: R$ {performance.averageTicket.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px]">
              <DialogHeader>
                <DialogTitle>Desempenho Financeiro por Colaborador - {getTimeRangeLabel()}</DialogTitle>
              </DialogHeader>
              
              <div className="mt-4">
                <Tabs defaultValue="table" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="table">Dados Detalhados</TabsTrigger>
                    <TabsTrigger value="ticket">Ticket Médio</TabsTrigger>
                    <TabsTrigger value="revenue">Faturamento</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="table" className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Colaborador</TableHead>
                          <TableHead className="text-right">Atendimentos</TableHead>
                          <TableHead className="text-right">Faturamento</TableHead>
                          <TableHead className="text-right">Ticket Médio</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {collaboratorStats.map((stat) => (
                          <TableRow key={stat.id}>
                            <TableCell className="font-medium">{stat.name}</TableCell>
                            <TableCell className="text-right">{stat.appointments}</TableCell>
                            <TableCell className="text-right">R$ {stat.totalRevenue.toFixed(2)}</TableCell>
                            <TableCell className="text-right">R$ {stat.averageTicket.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                  
                  <TabsContent value="ticket" className="mt-4">
                    {collaboratorStats.length > 0 ? (
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={collaboratorStats}
                            margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis 
                              type="category" 
                              dataKey="name" 
                              tick={{ fontSize: 12 }}
                              width={120}
                            />
                            <Tooltip 
                              formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
                            />
                            <Legend />
                            <Bar 
                              dataKey="averageTicket" 
                              name="Ticket Médio" 
                              fill="#2563eb" 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        Não há dados suficientes para exibir
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="revenue" className="mt-4">
                    {collaboratorStats.length > 0 ? (
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={collaboratorStats}
                            margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis 
                              type="category" 
                              dataKey="name" 
                              tick={{ fontSize: 12 }}
                              width={120}
                            />
                            <Tooltip 
                              formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
                            />
                            <Legend />
                            <Bar 
                              dataKey="totalRevenue" 
                              name="Faturamento" 
                              fill="#10b981" 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        Não há dados suficientes para exibir
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="h-64 w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  name="Receita" 
                  stroke="#2563eb" 
                  fill="#dbeafe" 
                  activeDot={{ r: 8 }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="expense" 
                  name="Despesa" 
                  stroke="#ef4444" 
                  fill="#fee2e2" 
                  activeDot={{ r: 8 }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              Sem dados financeiros para exibir no período selecionado
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
