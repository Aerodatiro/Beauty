import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import ClientForm from "@/components/clients/client-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Plus, Edit, Trash2, UserRound, Phone, Calendar, ArrowLeft, Clock, Info, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<any | null>(null);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [view, setView] = useState<"grid" | "details">("grid");
  const { toast } = useToast();

  // Fetch clients
  const { 
    data: clients, 
    isLoading 
  } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch client appointments when a client is selected
  const { 
    data: clientAppointments,
    isLoading: isAppointmentsLoading
  } = useQuery<any[]>({
    queryKey: ["/api/appointments", { clientId: selectedClient?.id }],
    enabled: !!selectedClient,
  });
  
  // Filter clients by search query if present
  const filteredClients = clients && searchQuery 
    ? clients.filter((client: any) => 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.includes(searchQuery)
      )
    : clients;

  // Handle client deletion
  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    
    try {
      await apiRequest("DELETE", `/api/clients/${clientToDelete}`);
      
      toast({
        title: "Cliente excluído",
        description: "O cliente foi excluído com sucesso.",
      });
      
      // Invalidate clients query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o cliente.",
        variant: "destructive",
      });
    }
  };

  // Set up client for editing
  const handleEditClient = (client: any) => {
    setClientToEdit(client);
    setIsClientDialogOpen(true);
  };

  // Handle new client button click
  const handleNewClient = () => {
    setClientToEdit(null);
    setIsClientDialogOpen(true);
  };
  
  // Handle show client details
  const handleShowDetails = (client: any) => {
    setSelectedClient(client);
    setView("details");
  };
  
  // Handle back to client list
  const handleBackToList = () => {
    setSelectedClient(null);
    setView("grid");
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex">
      <Sidebar />
      <MobileNav />
      
      <div className="flex-1 md:ml-64 pt-4 md:pt-0">
        <div className="md:p-8 p-4 pt-16 md:pt-8">
          {view === "grid" ? (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-800">Clientes</h2>
                  <p className="text-neutral-500">Gerencie os clientes da sua empresa</p>
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
                  <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={handleNewClient}>
                        <Plus className="h-4 w-4 mr-2" /> Adicionar Cliente
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>
                          {clientToEdit ? "Editar Cliente" : "Adicionar Cliente"}
                        </DialogTitle>
                      </DialogHeader>
                      <ClientForm 
                        client={clientToEdit}
                        onSuccess={() => {
                          setIsClientDialogOpen(false);
                          queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              {/* Clients Grid */}
              {isLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                </div>
              ) : filteredClients && filteredClients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredClients.map((client: any) => {
                    // Format creation date
                    const creationDate = new Date(client.createdAt);
                    const formattedDate = format(creationDate, "dd MMM yyyy", { locale: ptBR });
                    
                    return (
                      <Card key={client.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <UserRound className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg">{client.name}</h3>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Phone className="h-3 w-3 mr-1" /> {client.phone}
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditClient(client)}
                              >
                                <Edit className="h-4 w-4 text-primary" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setClientToDelete(client.id);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                          
                          {client.notes && (
                            <div className="mt-3 bg-gray-50 p-2 rounded text-sm text-gray-700">
                              <p>{client.notes}</p>
                            </div>
                          )}
                          
                          <div className="mt-3 flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              Cliente desde: {formattedDate}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-primary text-xs"
                              onClick={() => handleShowDetails(client)}
                            >
                              Histórico <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500 bg-white rounded-lg shadow-sm">
                  {searchQuery ? (
                    <p>Nenhum cliente encontrado para "{searchQuery}"</p>
                  ) : (
                    <div className="space-y-3">
                      <UserRound className="h-16 w-16 mx-auto text-gray-300" />
                      <p>Nenhum cliente cadastrado ainda</p>
                      <Button onClick={handleNewClient}>
                        <Plus className="h-4 w-4 mr-2" /> Adicionar Cliente
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Client Details View */}
              <div className="mb-6">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mb-4"
                  onClick={handleBackToList}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para a lista
                </Button>
                
                {selectedClient && (
                  <div className="grid grid-cols-1 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                              <UserRound className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold text-neutral-800">{selectedClient.name}</h2>
                              <div className="flex items-center text-neutral-500">
                                <Phone className="h-4 w-4 mr-2" /> {selectedClient.phone}
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0 flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditClient(selectedClient)}
                            >
                              <Edit className="h-4 w-4 mr-2" /> Editar
                            </Button>
                          </div>
                        </div>
                        
                        {selectedClient.notes && (
                          <div className="mt-6">
                            <h3 className="text-sm font-medium mb-2">Observações</h3>
                            <div className="bg-neutral-50 p-3 rounded-md text-neutral-700">
                              {selectedClient.notes}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Histórico de Atendimentos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isAppointmentsLoading ? (
                          <div className="py-12 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                          </div>
                        ) : clientAppointments && clientAppointments.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Procedimento</TableHead>
                                <TableHead>Profissional</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {clientAppointments.map((appointment: any) => {
                                const appointmentDate = new Date(appointment.date);
                                const formattedDate = format(appointmentDate, "dd/MM/yyyy HH:mm");
                                const isPastAppointment = isPast(appointmentDate);
                                
                                let statusBadge;
                                switch(appointment.status) {
                                  case 'completed':
                                    statusBadge = <Badge className="bg-green-100 text-green-800">Concluído</Badge>
                                    break;
                                  case 'canceled':
                                    statusBadge = <Badge className="bg-red-100 text-red-800">Cancelado</Badge>
                                    break;
                                  case 'scheduled':
                                    statusBadge = isPastAppointment ? 
                                      <Badge className="bg-amber-100 text-amber-800">Não compareceu</Badge> : 
                                      <Badge className="bg-blue-100 text-blue-800">Agendado</Badge>
                                    break;
                                  default:
                                    statusBadge = <Badge className="bg-gray-100 text-gray-800">{appointment.status}</Badge>
                                }
                                
                                return (
                                  <TableRow key={appointment.id}>
                                    <TableCell>{formattedDate}</TableCell>
                                    <TableCell>{appointment.procedure?.name || 'N/A'}</TableCell>
                                    <TableCell>{appointment.collaborator?.name || 'N/A'}</TableCell>
                                    <TableCell>R$ {Number(appointment.value).toFixed(2)}</TableCell>
                                    <TableCell>{statusBadge}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="py-12 text-center text-gray-500">
                            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                            <p>Este cliente ainda não realizou nenhum atendimento</p>
                            <Button className="mt-4" size="sm" asChild>
                              <a href="/appointments">Agendar atendimento</a>
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Confirmar exclusão</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.</p>
                <p className="text-sm text-red-500 mt-2">
                  Nota: Esta ação também excluirá todos os agendamentos relacionados a este cliente.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDeleteClient}>
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
