import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Loader2, 
  Calendar as CalendarIcon, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  Plus,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function FinancePage() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedTab, setSelectedTab] = useState("overview");
  const [goalAmount, setGoalAmount] = useState<string>("");
  const { toast } = useToast();
  const { user } = useAuth();

  // Get first and last day of selected month
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

  // Fetch financial records
  const { 
    data: financialRecords, 
    isLoading: isRecordsLoading 
  } = useQuery({
    queryKey: ["/api/financial-records", { 
      startDate: firstDay.toISOString(), 
      endDate: lastDay.toISOString() 
    }],
  });

  // Fetch financial goals
  const { 
    data: financialGoals, 
    isLoading: isGoalsLoading 
  } = useQuery({
    queryKey: ["/api/financial-goals"],
  });

  // Calculate financial summary
  const calculateSummary = () => {
    if (!financialRecords) return { income: 0, expenses: 0, profit: 0 };
    
    const income = financialRecords
      .filter((record: any) => record.type === "income")
      .reduce((sum: number, record: any) => sum + Number(record.value), 0);
    
    const expenses = financialRecords
      .filter((record: any) => record.type === "expense")
      .reduce((sum: number, record: any) => sum + Number(record.value), 0);
    
    return {
      income,
      expenses,
      profit: income - expenses
    };
  };

  const financialSummary = calculateSummary();

  // Prepare data for financial charts
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

  // Find current financial goal if any
  const currentGoal = financialGoals?.find((goal: any) => {
    const startDate = new Date(goal.startDate);
    const endDate = new Date(goal.endDate);
    const now = new Date();
    
    return now >= startDate && now <= endDate;
  });

  // Calculate progress towards goal
  const calculateGoalProgress = () => {
    if (!currentGoal) return 0;
    
    const target = Number(currentGoal.target);
    const progress = (financialSummary.income / target) * 100;
    
    return Math.min(progress, 100);
  };

  const goalProgress = calculateGoalProgress();

  // Handle new financial goal submission
  const handleSetGoal = async () => {
    if (!goalAmount) {
      toast({
        title: "Erro",
        description: "Por favor, insira um valor para a meta.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Calculate 1 month from now for goal end date
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      
      const response = await apiRequest("POST", "/api/financial-goals", {
        target: goalAmount, // enviar como string para compatibilidade com numeric no banco
        period: "monthly",
        startDate: new Date(),
        endDate,
      });
      
      toast({
        title: "Meta definida",
        description: "A meta financeira foi definida com sucesso.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/financial-goals"] });
      setGoalAmount("");
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível definir a meta financeira.",
        variant: "destructive",
      });
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
              <h2 className="text-2xl font-bold text-neutral-800">Financeiro</h2>
              <p className="text-neutral-500">Acompanhe e gerencie as finanças da sua empresa</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2">
              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(date, "MMMM yyyy", { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => newDate && setDate(newDate)}
                      initialFocus
                      month={date}
                      onMonthChange={setDate}
                      captionLayout="dropdown-buttons"
                      fromYear={2020}
                      toYear={2030}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-neutral-500">Total de Entradas</p>
                    <h3 className="text-2xl font-bold text-neutral-800 mt-1">
                      R$ {financialSummary.income.toFixed(2)}
                    </h3>
                  </div>
                  <div className="p-3 bg-green-50 rounded-full text-green-500">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-neutral-500">Total de Saídas</p>
                    <h3 className="text-2xl font-bold text-neutral-800 mt-1">
                      R$ {financialSummary.expenses.toFixed(2)}
                    </h3>
                  </div>
                  <div className="p-3 bg-red-50 rounded-full text-red-500">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-neutral-500">Lucro</p>
                    <h3 className="text-2xl font-bold text-neutral-800 mt-1">
                      R$ {financialSummary.profit.toFixed(2)}
                    </h3>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-full text-primary">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Financial Charts and Tables */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="income">Entradas</TabsTrigger>
              <TabsTrigger value="expenses">Saídas</TabsTrigger>
              <TabsTrigger value="goals">Metas</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Resultado Mensal</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  {isRecordsLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    </div>
                  ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                        <Legend />
                        <Bar dataKey="income" name="Entradas" fill="#22c55e" />
                        <Bar dataKey="expense" name="Saídas" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-neutral-500">
                      Nenhum registro financeiro para o período selecionado
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Custos Fixos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isRecordsLoading ? (
                      <div className="py-6 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {financialRecords?.filter((record: any) => 
                          record.type === "expense" && record.category === "fixed_cost"
                        ).map((record: any) => (
                          <div key={record.id} className="flex justify-between items-center p-2 border-b">
                            <div>
                              <p className="font-medium">{record.description}</p>
                              <p className="text-sm text-neutral-500">
                                {format(new Date(record.date), "dd MMM yyyy", { locale: ptBR })}
                              </p>
                            </div>
                            <p className="text-red-500 font-medium">- R$ {Number(record.value).toFixed(2)}</p>
                          </div>
                        ))}
                        
                        {(!financialRecords || financialRecords.filter((record: any) => 
                          record.type === "expense" && record.category === "fixed_cost"
                        ).length === 0) && (
                          <div className="py-6 text-center text-gray-500">
                            Nenhum custo fixo registrado
                          </div>
                        )}
                        
                        <Button className="w-full mt-4">
                          <Plus className="h-4 w-4 mr-2" /> Adicionar Custo Fixo
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Custos Variáveis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isRecordsLoading ? (
                      <div className="py-6 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {financialRecords?.filter((record: any) => 
                          record.type === "expense" && record.category === "variable_cost"
                        ).map((record: any) => (
                          <div key={record.id} className="flex justify-between items-center p-2 border-b">
                            <div>
                              <p className="font-medium">{record.description}</p>
                              <p className="text-sm text-neutral-500">
                                {format(new Date(record.date), "dd MMM yyyy", { locale: ptBR })}
                              </p>
                            </div>
                            <p className="text-red-500 font-medium">- R$ {Number(record.value).toFixed(2)}</p>
                          </div>
                        ))}
                        
                        {(!financialRecords || financialRecords.filter((record: any) => 
                          record.type === "expense" && record.category === "variable_cost"
                        ).length === 0) && (
                          <div className="py-6 text-center text-gray-500">
                            Nenhum custo variável registrado
                          </div>
                        )}
                        
                        <Button className="w-full mt-4">
                          <Plus className="h-4 w-4 mr-2" /> Adicionar Custo Variável
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Meta do Período</CardTitle>
                </CardHeader>
                <CardContent>
                  {isGoalsLoading ? (
                    <div className="py-6 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    </div>
                  ) : currentGoal ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-neutral-500">Progresso</p>
                          <div className="text-xl font-bold flex items-center mt-1">
                            <Target className="h-5 w-5 mr-2 text-primary" />
                            R$ {financialSummary.income.toFixed(2)} / R$ {Number(currentGoal.target).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-sm">
                          {format(new Date(currentGoal.startDate), "dd MMM", { locale: ptBR })} - {format(new Date(currentGoal.endDate), "dd MMM yyyy", { locale: ptBR })}
                        </div>
                      </div>
                      
                      <div className="w-full bg-neutral-100 rounded-full h-4">
                        <div 
                          className="bg-primary h-4 rounded-full" 
                          style={{ width: `${goalProgress}%` }}
                        />
                      </div>
                      
                      <p className="text-center text-sm text-neutral-500">
                        {goalProgress.toFixed(0)}% da meta atingida
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="py-2 text-center text-gray-500 mb-4">
                        Nenhuma meta definida para o período atual
                      </div>
                      
                      <div className="flex gap-2">
                        <Input 
                          type="number" 
                          placeholder="Valor da meta" 
                          value={goalAmount}
                          onChange={(e) => setGoalAmount(e.target.value)}
                        />
                        <Button onClick={handleSetGoal}>Definir meta</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Income Tab */}
            <TabsContent value="income" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Entradas Financeiras</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  {isRecordsLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    </div>
                  ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                        <Legend />
                        <Line type="monotone" dataKey="income" name="Entradas" stroke="#22c55e" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-neutral-500">
                      Nenhum registro de entrada para o período selecionado
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Detalhamento de Entradas</CardTitle>
                </CardHeader>
                <CardContent>
                  {isRecordsLoading ? (
                    <div className="py-6 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {financialRecords?.filter((record: any) => record.type === "income")
                        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((record: any) => (
                          <div key={record.id} className="flex justify-between items-center p-2 border-b">
                            <div>
                              <p className="font-medium">{record.description}</p>
                              <p className="text-sm text-neutral-500">
                                {format(new Date(record.date), "dd MMM yyyy", { locale: ptBR })}
                              </p>
                            </div>
                            <p className="text-green-500 font-medium">+ R$ {Number(record.value).toFixed(2)}</p>
                          </div>
                        ))}
                      
                      {(!financialRecords || financialRecords.filter((record: any) => record.type === "income").length === 0) && (
                        <div className="py-6 text-center text-gray-500">
                          Nenhuma entrada registrada para o período selecionado
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Expenses Tab */}
            <TabsContent value="expenses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Saídas Financeiras</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  {isRecordsLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    </div>
                  ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                        <Legend />
                        <Line type="monotone" dataKey="expense" name="Saídas" stroke="#ef4444" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-neutral-500">
                      Nenhum registro de saída para o período selecionado
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Detalhamento de Saídas</CardTitle>
                </CardHeader>
                <CardContent>
                  {isRecordsLoading ? (
                    <div className="py-6 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {financialRecords?.filter((record: any) => record.type === "expense")
                        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((record: any) => (
                          <div key={record.id} className="flex justify-between items-center p-2 border-b">
                            <div>
                              <p className="font-medium">{record.description}</p>
                              <div className="flex items-center">
                                <p className="text-sm text-neutral-500 mr-2">
                                  {format(new Date(record.date), "dd MMM yyyy", { locale: ptBR })}
                                </p>
                                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                                  {record.category === 'fixed_cost' ? 'Custo Fixo' : 'Custo Variável'}
                                </span>
                              </div>
                            </div>
                            <p className="text-red-500 font-medium">- R$ {Number(record.value).toFixed(2)}</p>
                          </div>
                        ))}
                      
                      {(!financialRecords || financialRecords.filter((record: any) => record.type === "expense").length === 0) && (
                        <div className="py-6 text-center text-gray-500">
                          Nenhuma saída registrada para o período selecionado
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Goals Tab */}
            <TabsContent value="goals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Metas Financeiras</CardTitle>
                </CardHeader>
                <CardContent>
                  {isGoalsLoading ? (
                    <div className="py-6 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {financialGoals?.map((goal: any) => {
                        const startDate = new Date(goal.startDate);
                        const endDate = new Date(goal.endDate);
                        const now = new Date();
                        const isActive = now >= startDate && now <= endDate;
                        
                        // Calculate progress if active
                        let progress = 0;
                        if (isActive) {
                          const target = Number(goal.target);
                          progress = (financialSummary.income / target) * 100;
                          progress = Math.min(progress, 100);
                        }
                        
                        return (
                          <div key={goal.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  Meta: R$ {Number(goal.target).toFixed(2)}
                                </h3>
                                <p className="text-sm text-neutral-500">
                                  {format(startDate, "dd MMM yyyy", { locale: ptBR })} - {format(endDate, "dd MMM yyyy", { locale: ptBR })}
                                </p>
                              </div>
                              <Badge variant={isActive ? "default" : "outline"}>
                                {isActive ? "Ativa" : "Inativa"}
                              </Badge>
                            </div>
                            
                            {isActive && (
                              <div className="space-y-2">
                                <div className="w-full bg-neutral-100 rounded-full h-4">
                                  <div 
                                    className="bg-primary h-4 rounded-full" 
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Progresso: {progress.toFixed(0)}%</span>
                                  <span>
                                    R$ {financialSummary.income.toFixed(2)} / R$ {Number(goal.target).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {(!financialGoals || financialGoals.length === 0) && (
                        <div className="py-6 text-center text-gray-500">
                          Nenhuma meta financeira definida
                        </div>
                      )}
                      
                      <div className="mt-6 p-4 border rounded-lg">
                        <h3 className="font-semibold mb-4">Definir Nova Meta</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Valor da Meta
                            </label>
                            <Input 
                              type="number" 
                              placeholder="R$ 0,00"
                              value={goalAmount}
                              onChange={(e) => setGoalAmount(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Período
                            </label>
                            <Select defaultValue="monthly">
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o período" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">Mensal</SelectItem>
                                <SelectItem value="quarterly">Trimestral</SelectItem>
                                <SelectItem value="yearly">Anual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button className="w-full mt-4" onClick={handleSetGoal}>
                          Definir Meta
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
