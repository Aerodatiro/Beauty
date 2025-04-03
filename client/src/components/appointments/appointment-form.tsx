import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Form schema for appointment
const appointmentSchema = z.object({
  clientId: z.string().min(1, { message: "Cliente é obrigatório" }),
  collaboratorId: z.string().min(1, { message: "Colaborador é obrigatório" }),
  procedureIds: z.array(z.string()).min(1, { message: "Pelo menos um procedimento é obrigatório" }),
  date: z.date({ required_error: "Data é obrigatória" }),
  time: z.string().min(1, { message: "Horário é obrigatório" }),
  status: z.string().min(1, { message: "Status é obrigatório" }),
  value: z.string().min(1, { message: "Valor é obrigatório" }),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  appointment?: any;
  onSuccess: () => void;
}

export default function AppointmentForm({ appointment, onSuccess }: AppointmentFormProps) {
  const { toast } = useToast();
  
  // Fetch clients for dropdown
  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });
  
  // Fetch collaborators for dropdown
  const { data: collaborators } = useQuery({
    queryKey: ["/api/collaborators"],
  });
  
  // Fetch procedures for dropdown
  const { data: procedures } = useQuery({
    queryKey: ["/api/procedures"],
  });
  
  // Set up form with default values
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientId: "",
      collaboratorId: "",
      procedureIds: [],
      date: new Date(),
      time: "09:00",
      status: "scheduled",
      value: "",
      notes: "",
    },
  });
  
  // Fetch appointment procedures when editing
  const { data: appointmentProcedures } = useQuery({
    queryKey: appointment ? ["/api/appointments", appointment.id, "procedures"] : null,
    enabled: !!appointment
  });
  
  // Set form values when editing an existing appointment
  useEffect(() => {
    if (appointment) {
      const appointmentDate = new Date(appointment.date);
      
      // Fetch procedures for this appointment
      if (appointmentProcedures) {
        const procedureIdStrings = appointmentProcedures.map((p: any) => p.id.toString());
        
        form.reset({
          clientId: appointment.clientId.toString(),
          collaboratorId: appointment.collaboratorId.toString(),
          procedureIds: procedureIdStrings,
          date: appointmentDate,
          time: format(appointmentDate, "HH:mm"),
          status: appointment.status,
          value: appointment.value.toString(),
          notes: appointment.notes || "",
        });
      }
    }
  }, [appointment, form, appointmentProcedures]);
  
  // Update value when procedures change
  const watchProcedureIds = form.watch("procedureIds");
  
  useEffect(() => {
    if (watchProcedureIds && watchProcedureIds.length > 0 && procedures) {
      // Calculate the total value of all selected procedures
      let totalValue = 0;
      watchProcedureIds.forEach((procedureId: string) => {
        const selectedProcedure = procedures.find((p: any) => p.id.toString() === procedureId);
        if (selectedProcedure) {
          totalValue += parseFloat(selectedProcedure.value);
        }
      });
      
      form.setValue("value", totalValue.toFixed(2));
    } else {
      form.setValue("value", "0.00");
    }
  }, [watchProcedureIds, procedures, form]);
  
  // Handle form submission
  const onSubmit = async (data: AppointmentFormValues) => {
    try {
      // Prepare appointment data
      console.log("Data antes de processar:", data);
      
      // Combine date and time to create a correct ISO date string
      const [hours, minutes] = data.time.split(":");
      const appointmentDate = new Date(data.date);
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      console.log("Data do agendamento processada:", appointmentDate);
      console.log("Data ISO:", appointmentDate.toISOString());
      
      // Preparar dados com o formato correto para o backend
      const appointmentData = {
        clientId: parseInt(data.clientId),
        collaboratorId: parseInt(data.collaboratorId),
        procedureIds: data.procedureIds,
        date: appointmentDate.toISOString(), // Enviar como string ISO para evitar problemas de timezone
        status: data.status,
        value: data.value,
        notes: data.notes || "",
      };
      
      console.log("Dados a serem enviados:", appointmentData);
      
      if (appointment) {
        // Update existing appointment
        await apiRequest("PUT", `/api/appointments/${appointment.id}`, appointmentData);
        toast({
          title: "Agendamento atualizado",
          description: "O agendamento foi atualizado com sucesso.",
        });
      } else {
        // Create new appointment
        await apiRequest("POST", "/api/appointments", appointmentData);
        toast({
          title: "Agendamento criado",
          description: "O agendamento foi criado com sucesso.",
        });
      }
      
      // Reset form and notify parent of success
      form.reset();
      onSuccess();
      
      // Invalidate appointments query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    } catch (error: any) {
      console.error("Erro ao salvar agendamento:", error);
      
      toast({
        title: "Erro ao salvar agendamento",
        description: error.message || "Erro ao processar o agendamento. Verifique os dados e tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  // Available time slots
  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30"
  ];
  
  // Status options
  const statusOptions = [
    { value: "scheduled", label: "Agendado" },
    { value: "confirmed", label: "Confirmado" },
    { value: "completed", label: "Concluído" },
    { value: "cancelled", label: "Cancelado" },
  ];
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients?.map((client: any) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="collaboratorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Colaborador</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um colaborador" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {collaborators?.map((collaborator: any) => (
                      <SelectItem key={collaborator.id} value={collaborator.id.toString()}>
                        {collaborator.name} ({collaborator.function})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="procedureIds"
          render={() => (
            <FormItem>
              <FormLabel>Procedimentos</FormLabel>
              <div className="border rounded-md p-4 space-y-3">
                {procedures?.map((procedure: any) => (
                  <FormField
                    key={procedure.id}
                    control={form.control}
                    name="procedureIds"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={procedure.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(procedure.id.toString())}
                              onCheckedChange={(checked) => {
                                const procedureId = procedure.id.toString();
                                if (checked) {
                                  field.onChange([...field.value, procedureId]);
                                } else {
                                  field.onChange(field.value?.filter((value) => value !== procedureId));
                                }
                              }}
                            />
                          </FormControl>
                          <div className="flex items-center justify-between w-full">
                            <FormLabel className="font-normal">
                              {procedure.name}
                            </FormLabel>
                            <span className="text-sm text-muted-foreground">
                              R$ {parseFloat(procedure.value).toFixed(2)}
                            </span>
                          </div>
                        </FormItem>
                      );
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um horário">
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4" />
                          {field.value}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="0.00" 
                    {...field} 
                    readOnly
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observações sobre o agendamento"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <p className="text-sm text-blue-600 italic">
          O valor total é calculado automaticamente com base nos procedimentos selecionados.
        </p>
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button 
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Salvando..." : 
             appointment ? "Salvar alterações" : "Criar agendamento"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
