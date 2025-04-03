import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import ProcedureForm from "@/components/procedures/procedure-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Scissors,
  DollarSign
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
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

export default function ProceduresPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<number | null>(null);
  const [isProcedureDialogOpen, setIsProcedureDialogOpen] = useState(false);
  const [procedureToEdit, setProcedureToEdit] = useState<any | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch procedures
  const { 
    data: procedures, 
    isLoading 
  } = useQuery({
    queryKey: ["/api/procedures"],
  });

  // Filter procedures by search query if present
  const filteredProcedures = searchQuery 
    ? procedures?.filter((procedure: any) => 
        procedure.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : procedures;

  // Handle procedure deletion
  const handleDeleteProcedure = async () => {
    if (!procedureToDelete) return;
    
    try {
      await apiRequest("DELETE", `/api/procedures/${procedureToDelete}`);
      
      toast({
        title: "Procedimento excluído",
        description: "O procedimento foi excluído com sucesso.",
      });
      
      // Invalidate procedures query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/procedures"] });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o procedimento.",
        variant: "destructive",
      });
    }
  };

  // Set up procedure for editing
  const handleEditProcedure = (procedure: any) => {
    setProcedureToEdit(procedure);
    setIsProcedureDialogOpen(true);
  };

  // Handle new procedure button click
  const handleNewProcedure = () => {
    setProcedureToEdit(null);
    setIsProcedureDialogOpen(true);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-neutral-100 flex">
      <Sidebar />
      <MobileNav />
      
      <div className="flex-1 md:ml-64 pt-4 md:pt-0">
        <div className="md:p-8 p-4 pt-16 md:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-neutral-800">Procedimentos</h2>
              <p className="text-neutral-500">Gerencie os serviços oferecidos pela sua empresa</p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-start md:items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Pesquisar procedimento..."
                  className="pl-9 pr-4 py-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {isAdmin && (
                <Dialog open={isProcedureDialogOpen} onOpenChange={setIsProcedureDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleNewProcedure}>
                      <Plus className="h-4 w-4 mr-2" /> Novo Procedimento
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>
                        {procedureToEdit ? "Editar Procedimento" : "Novo Procedimento"}
                      </DialogTitle>
                    </DialogHeader>
                    <ProcedureForm 
                      procedure={procedureToEdit}
                      onSuccess={() => {
                        setIsProcedureDialogOpen(false);
                        queryClient.invalidateQueries({ queryKey: ["/api/procedures"] });
                      }}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          
          {/* Procedures Table */}
          <Card className="overflow-hidden">
            {isLoading ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
              </div>
            ) : filteredProcedures && filteredProcedures.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">#</TableHead>
                    <TableHead>Nome do Procedimento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    {isAdmin && <TableHead className="text-right w-[120px]">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProcedures.map((procedure: any, index: number) => (
                    <TableRow key={procedure.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Scissors className="h-4 w-4 mr-2 text-primary" />
                          {procedure.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <div className="flex items-center justify-end">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          R$ {Number(procedure.value).toFixed(2)}
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditProcedure(procedure)}
                          >
                            <Edit className="h-4 w-4 text-primary" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setProcedureToDelete(procedure.id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center text-gray-500">
                {searchQuery ? (
                  <p>Nenhum procedimento encontrado para "{searchQuery}"</p>
                ) : (
                  <div className="space-y-3">
                    <Scissors className="h-16 w-16 mx-auto text-gray-300" />
                    <p>Nenhum procedimento cadastrado ainda</p>
                    {isAdmin && (
                      <Button onClick={handleNewProcedure}>
                        <Plus className="h-4 w-4 mr-2" /> Adicionar Procedimento
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
          
          {/* Delete Confirmation Dialog */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Confirmar exclusão</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p>Tem certeza que deseja excluir este procedimento? Esta ação não pode ser desfeita.</p>
                <p className="text-sm text-red-500 mt-2">
                  Nota: Esta ação também pode afetar agendamentos que utilizam este procedimento.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDeleteProcedure}>
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
