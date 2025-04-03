import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import CalendarView from "@/components/appointments/calendar-view";
import AppointmentForm from "@/components/appointments/appointment-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  FilterIcon,
  X
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Badge
} from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function AppointmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<number | null>(null);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<any | null>(null);
  const [selectedCollaborator, setSelectedCollaborator] = useState<string>("all");
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Format date for API query
  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  // Fetch collaborators
  const { data: collaborators, isLoading: isLoadingCollaborators } = useQuery({
    queryKey: ["/api/collaborators"],
  });

  // Fetch appointments for selected date
  const { 
    data: appointments, 
    isLoading 
  } = useQuery({
    queryKey: ["/api/appointments", { 
      startDate: formattedDate, 
      endDate: formattedDate 
    }],
  });

  // Filter appointments by search query and collaborator
  const filteredAppointments = appointments?.filter((appointment: any) => {
    const matchesSearch = !searchQuery || 
      appointment.client?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCollaborator = 
      selectedCollaborator === "all" || 
      appointment.collaborator?.id.toString() === selectedCollaborator;
    
    return matchesSearch && matchesCollaborator;
  });

  // Handle appointment deletion
  const handleDeleteAppointment = async () => {
    if (!appointmentToDelete) return;
    
    try {
      await apiRequest("DELETE", `/api/appointments/${appointmentToDelete}`);
      
      toast({
        title: "Agendamento excluído",
        description: "O agendamento foi excluído com sucesso.",
      });
      
      // Invalidate appointments query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o agendamento.",
        variant: "destructive",
      });
    }
  };

  // Set up appointment for editing
  const handleEditAppointment = (appointment: any) => {
    setAppointmentToEdit(appointment);
    setIsAppointmentDialogOpen(true);
  };

  // Handle new appointment button click
  const handleNewAppointment = () => {
    setAppointmentToEdit(null);
    setIsAppointmentDialogOpen(true);
  };

  // Mark appointment as completed
  const handleMarkCompleted = async (appointment: any) => {
    try {
      const updatedAppointment = {
        ...appointment,
        status: "completed"
      };
      
      await apiRequest("PUT", `/api/appointments/${appointment.id}`, updatedAppointment);
      
      toast({
        title: "Agendamento atualizado",
        description: "O agendamento foi marcado como concluído.",
      });
      
      // Invalidate appointments query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status do agendamento.",
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
              <h2 className="text-2xl font-bold text-neutral-800">Agenda</h2>
              <p className="text-neutral-500">Gerencie os agendamentos da sua empresa</p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-start md:items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Pesquisar cliente..."
                  className="pl-9 pr-4 py-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleNewAppointment}>
                    <Plus className="h-4 w-4 mr-2" /> Novo Agendamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>
                      {appointmentToEdit ? "Editar Agendamento" : "Novo Agendamento"}
                    </DialogTitle>
                  </DialogHeader>
                  <AppointmentForm 
                    appointment={appointmentToEdit}
                    onSuccess={() => {
                      setIsAppointmentDialogOpen(false);
                      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Appointments Section */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-5 border-b border-neutral-100 flex flex-col md:flex-row justify-between items-start md:items-center">
              <h3 className="font-semibold text-neutral-800">
                Agendamentos de {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </h3>
              <div className="flex items-center gap-2 mt-2 md:mt-0">
                <div className="flex items-center">
                  <FilterIcon className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm text-gray-500 mr-2">Filtrar por colaborador:</span>
                </div>
                <Select 
                  value={selectedCollaborator} 
                  onValueChange={setSelectedCollaborator}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Selecione um colaborador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os colaboradores</SelectItem>
                    {collaborators?.map((collaborator: any) => (
                      <SelectItem key={collaborator.id} value={collaborator.id.toString()}>
                        {collaborator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                </div>
              ) : filteredAppointments && filteredAppointments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horário</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Serviços</TableHead>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((appointment: any) => {
                      const appointmentDate = new Date(appointment.date);
                      const status = appointment.status;
                      
                      let statusVariant = "default";
                      let statusLabel = "Agendado";
                      
                      if (status === "confirmed") {
                        statusVariant = "warning";
                        statusLabel = "Confirmado";
                      } else if (status === "completed") {
                        statusVariant = "success";
                        statusLabel = "Concluído";
                      } else if (status === "cancelled") {
                        statusVariant = "destructive";
                        statusLabel = "Cancelado";
                      }
                      
                      return (
                        <TableRow key={appointment.id}>
                          <TableCell className="font-medium">
                            {format(appointmentDate, "HH:mm")}
                          </TableCell>
                          <TableCell>{appointment.client?.name}</TableCell>
                          <TableCell>
                            {appointment.procedures?.map((proc: any) => proc.name).join(", ") || "Não especificado"}
                          </TableCell>
                          <TableCell>{appointment.collaborator?.name}</TableCell>
                          <TableCell>R$ {Number(appointment.value).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant as "default" | "secondary" | "destructive" | "outline" | undefined}>
                              {statusLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {status !== "completed" && status !== "cancelled" && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleMarkCompleted(appointment)}
                                title="Marcar como atendido"
                              >
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditAppointment(appointment)}
                            >
                              <Edit className="h-4 w-4 text-primary" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setAppointmentToDelete(appointment.id);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  Nenhum agendamento encontrado para essa data
                </div>
              )}
            </div>
          </div>
          
          {/* Calendar View - Moved to bottom as requested */}
          <div className="mt-6">
            <CalendarView 
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>
          
          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Confirmar exclusão</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDeleteAppointment}>
                  Excluir
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
