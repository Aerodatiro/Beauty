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

// Form schema for collaborator
const collaboratorSchema = z.object({
  name: z.string().min(1, { message: "Nome é obrigatório" }),
  email: z.string().email({ message: "Email inválido" }),
  phone: z.string().min(10, { message: "Telefone deve ter pelo menos 10 dígitos" }),
  function: z.string().min(1, { message: "Função é obrigatória" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }).optional(),
});

type CollaboratorFormValues = z.infer<typeof collaboratorSchema>;

interface CollaboratorFormProps {
  collaborator?: any;
  onSuccess: () => void;
}

export default function CollaboratorForm({ collaborator, onSuccess }: CollaboratorFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Set up form with default values
  const form = useForm<CollaboratorFormValues>({
    resolver: zodResolver(collaboratorSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      function: "",
      password: "",
    },
  });
  
  // Set form values when editing an existing collaborator
  useEffect(() => {
    if (collaborator) {
      form.reset({
        name: collaborator.name,
        email: collaborator.email,
        phone: collaborator.phone,
        function: collaborator.function,
        password: "", // Don't populate password field when editing
      });
    }
  }, [collaborator, form]);
  
  // Handle form submission
  const onSubmit = async (data: CollaboratorFormValues) => {
    try {
      const collaboratorData = {
        ...data,
        role: "collaborator",
        companyId: user?.companyId,
      };
      
      // If password is empty and editing, remove it from the request
      if (collaborator && !data.password) {
        delete collaboratorData.password;
      }
      
      if (collaborator) {
        // Update existing collaborator
        await apiRequest("PUT", `/api/users/${collaborator.id}`, collaboratorData);
        
        toast({
          title: "Colaborador atualizado",
          description: "O colaborador foi atualizado com sucesso.",
        });
      } else {
        // Create new collaborator directly (admin can add without invite code)
        await apiRequest("POST", "/api/users", collaboratorData);
        
        toast({
          title: "Colaborador adicionado",
          description: "O colaborador foi adicionado com sucesso.",
        });
      }
      
      // Reset form and notify parent of success
      form.reset();
      onSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o colaborador.",
        variant: "destructive",
      });
      console.error(error);
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
              <FormLabel>Nome do Colaborador</FormLabel>
              <FormControl>
                <Input placeholder="Nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Email" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(00) 00000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="function"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Função</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Barbeiro, Cabeleireiro, etc" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{collaborator ? "Nova Senha (opcional)" : "Senha"}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={collaborator ? "Deixe em branco para manter a senha atual" : "Senha"} 
                  type="password" 
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
            {collaborator ? "Salvar alterações" : "Adicionar colaborador"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
