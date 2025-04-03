import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schema for procedure
const procedureSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  value: z.string().min(1, { message: "Valor é obrigatório" }),
});

type ProcedureFormValues = z.infer<typeof procedureSchema>;

interface ProcedureFormProps {
  procedure?: any;
  onSuccess: () => void;
}

export default function ProcedureForm({ procedure, onSuccess }: ProcedureFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Set up form with default values
  const form = useForm<ProcedureFormValues>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      name: "",
      value: "",
    },
  });
  
  // Set form values when editing an existing procedure
  useEffect(() => {
    if (procedure) {
      form.reset({
        name: procedure.name,
        value: procedure.value.toString(),
      });
    }
  }, [procedure, form]);
  
  // Handle form submission
  const onSubmit = async (data: ProcedureFormValues) => {
    try {
      if (!user?.companyId) {
        toast({
          title: "Erro",
          description: "Informações da empresa não encontradas.",
          variant: "destructive",
        });
        return;
      }
      
      // Garante que o valor seja uma string para evitar problemas de validação
      const procedureData = {
        name: data.name,
        value: data.value, // Enviar como string, o esquema fará a conversão
        companyId: Number(user.companyId),
      };
      
      console.log("Enviando dados do procedimento:", procedureData);
      
      if (procedure) {
        // Update existing procedure
        await apiRequest("PUT", `/api/procedures/${procedure.id}`, procedureData);
        
        toast({
          title: "Procedimento atualizado",
          description: "O procedimento foi atualizado com sucesso.",
        });
      } else {
        // Create new procedure
        await apiRequest("POST", "/api/procedures", procedureData);
        
        toast({
          title: "Procedimento adicionado",
          description: "O procedimento foi adicionado com sucesso.",
        });
      }
      
      // Reset form and notify parent of success
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error("Erro ao salvar procedimento:", error);
      
      const errorMessage = error.message || "Não foi possível salvar o procedimento.";
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Procedimento</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Corte de Cabelo, Barba, etc" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor (R$)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="0.00" 
                  type="number" 
                  step="0.01" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit">
            {procedure ? "Salvar alterações" : "Adicionar procedimento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
