import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import CollaboratorForm from "@/components/collaborators/collaborator-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Plus, Edit, Trash2, UserRound, Copy, Phone, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function CollaboratorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [collaboratorToDelete, setCollaboratorToDelete] = useState<number | null>(null);
  const [isCollaboratorDialogOpen, setIsCollaboratorDialogOpen] = useState(false);
  const [collaboratorToEdit, setCollaboratorToEdit] = useState<any | null>(null);
  const { toast } = useToast();
  const { user, company } = useAuth();

  // Fetch collaborators
  const { 
    data: collaborators, 
    isLoading 
  } = useQuery({
    queryKey: ["/api/collaborators"],
  });

  // Filter collaborators by search query if present
  const filteredCollaborators = searchQuery 
    ? collaborators?.filter((collab: any) => 
        collab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collab.function.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : collaborators;

  // Handle collaborator deletion
  const handleDeleteCollaborator = async () => {
    if (!collaboratorToDelete) return;
    
    try {
      await apiRequest("DELETE", `/api/users/${collaboratorToDelete}`);
      
      toast({
        title: "Colaborador excluído",
        description: "O colaborador foi excluído com sucesso.",
      });
      
      // Invalidate collaborators query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/collaborators"] });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o colaborador.",
        variant: "destructive",
      });
    }
  };

  // Set up collaborator for editing
  const handleEditCollaborator = (collaborator: any) => {
    setCollaboratorToEdit(collaborator);
    setIsCollaboratorDialogOpen(true);
  };

  // Handle new collaborator button click
  const handleNewCollaborator = () => {
    setCollaboratorToEdit(null);
    setIsCollaboratorDialogOpen(true);
  };

  // Copy invite code to clipboard
  const copyInviteCode = () => {
    if (company?.inviteCode) {
      navigator.clipboard.writeText(company.inviteCode);
      toast({
        title: "Código copiado",
        description: "Código de convite copiado para a área de transferência.",
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
              <h2 className="text-2xl font-bold text-neutral-800">Colaboradores</h2>
              <p className="text-neutral-500">Gerencie a equipe da sua empresa</p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-start md:items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Pesquisar colaborador..."
                  className="pl-9 pr-4 py-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {user?.role === 'admin' && (
                <Dialog open={isCollaboratorDialogOpen} onOpenChange={setIsCollaboratorDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleNewCollaborator}>
                      <Plus className="h-4 w-4 mr-2" /> Adicionar Colaborador
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>
                        {collaboratorToEdit ? "Editar Colaborador" : "Adicionar Colaborador"}
                      </DialogTitle>
                    </DialogHeader>
                    <CollaboratorForm 
                      collaborator={collaboratorToEdit}
                      onSuccess={() => {
                        setIsCollaboratorDialogOpen(false);
                        queryClient.invalidateQueries({ queryKey: ["/api/collaborators"] });
                      }}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          
          {/* Invite Code Card (Admin only) */}
          {user?.role === 'admin' && company?.inviteCode && (
            <Card className="mb-6">
              <CardContent className="p-5">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">Código de Convite</h3>
                    <p className="text-sm text-gray-500 mb-2">
                      Compartilhe este código com novos colaboradores para que possam se cadastrar
                    </p>
                    <div className="bg-primary/10 p-3 rounded-md flex items-center justify-between">
                      <span className="font-mono font-bold text-primary">{company.inviteCode}</span>
                      <Button variant="ghost" size="icon" onClick={copyInviteCode}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Collaborators Grid */}
          {isLoading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
            </div>
          ) : filteredCollaborators && filteredCollaborators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCollaborators.map((collaborator: any) => (
                <Card key={collaborator.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <UserRound className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{collaborator.name}</h3>
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="h-3 w-3 mr-1" /> {collaborator.phone}
                          </div>
                        </div>
                      </div>
                      {user?.role === 'admin' && (
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditCollaborator(collaborator)}
                          >
                            <Edit className="h-4 w-4 text-primary" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setCollaboratorToDelete(collaborator.id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 flex items-center">
                      <Briefcase className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm text-gray-700">{collaborator.function}</span>
                    </div>
                    
                    <div className="mt-3">
                      <Badge variant="outline">{collaborator.email}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 bg-white rounded-lg shadow-sm">
              {searchQuery ? (
                <p>Nenhum colaborador encontrado para "{searchQuery}"</p>
              ) : (
                <div className="space-y-3">
                  <UserRound className="h-16 w-16 mx-auto text-gray-300" />
                  <p>Nenhum colaborador cadastrado ainda</p>
                  {user?.role === 'admin' && (
                    <Button onClick={handleNewCollaborator}>
                      <Plus className="h-4 w-4 mr-2" /> Adicionar Colaborador
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Confirmar exclusão</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>Tem certeza que deseja excluir este colaborador? Esta ação não pode ser desfeita.</p>
                <p className="text-sm text-red-500 mt-2">
                  Nota: Esta ação também excluirá todos os agendamentos relacionados a este colaborador.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDeleteCollaborator}>
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
