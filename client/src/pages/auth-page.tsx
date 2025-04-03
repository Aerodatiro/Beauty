import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, AdminRegisterData, CollaboratorRegisterData } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Scissors, 
  Calendar, 
  Users, 
  BarChart3, 
  UserCog 
} from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const adminRegisterSchema = z.object({
  company: z.object({
    name: z.string().min(1, { message: "Company name is required" }),
  }),
  user: z.object({
    name: z.string().min(1, { message: "Name is required" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    phone: z.string().min(10, { message: "Please enter a valid phone number" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  }),
});

const collaboratorRegisterSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().min(10, { message: "Please enter a valid phone number" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  function: z.string().min(1, { message: "Function is required" }),
  inviteCode: z.string().min(1, { message: "Invite code is required" }),
});

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loginMutation, registerAdminMutation, registerCollaboratorMutation } = useAuth();
  const [registerTab, setRegisterTab] = useState<"admin" | "collaborator">("admin");
  
  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    loginMutation.mutate(values);
  }

  // Admin registration form
  const adminRegisterForm = useForm<z.infer<typeof adminRegisterSchema>>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      company: {
        name: "",
      },
      user: {
        name: "",
        email: "",
        phone: "",
        password: "",
      },
    },
  });

  function onAdminRegisterSubmit(values: z.infer<typeof adminRegisterSchema>) {
    const adminData: AdminRegisterData = {
      company: values.company,
      user: values.user,
    };
    registerAdminMutation.mutate(adminData);
  }

  // Collaborator registration form
  const collaboratorRegisterForm = useForm<z.infer<typeof collaboratorRegisterSchema>>({
    resolver: zodResolver(collaboratorRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      function: "",
      inviteCode: "",
    },
  });

  function onCollaboratorRegisterSubmit(values: z.infer<typeof collaboratorRegisterSchema>) {
    const collaboratorData: CollaboratorRegisterData = values;
    registerCollaboratorMutation.mutate(collaboratorData);
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Panel */}
      <div className="bg-primary w-full md:w-1/2 min-h-[250px] md:min-h-screen flex items-center justify-center p-8 relative">
        <div className="text-white text-center max-w-lg">
          <h1 className="text-4xl font-bold mb-4">BeautyManager</h1>
          <p className="text-lg opacity-90">Gerencie sua barbearia ou salão de beleza com eficiência e praticidade</p>
          <div className="mt-10 grid grid-cols-2 gap-6">
            <div className="bg-white/10 rounded-lg p-5">
              <Calendar className="h-8 w-8 mb-3" />
              <h3 className="font-semibold text-lg">Agendamentos</h3>
              <p className="text-sm opacity-80">Organize sua agenda e nunca perca um cliente</p>
            </div>
            <div className="bg-white/10 rounded-lg p-5">
              <Users className="h-8 w-8 mb-3" />
              <h3 className="font-semibold text-lg">Clientes</h3>
              <p className="text-sm opacity-80">Mantenha um histórico completo de atendimentos</p>
            </div>
            <div className="bg-white/10 rounded-lg p-5">
              <BarChart3 className="h-8 w-8 mb-3" />
              <h3 className="font-semibold text-lg">Financeiro</h3>
              <p className="text-sm opacity-80">Acompanhe receitas, despesas e lucros</p>
            </div>
            <div className="bg-white/10 rounded-lg p-5">
              <UserCog className="h-8 w-8 mb-3" />
              <h3 className="font-semibold text-lg">Colaboradores</h3>
              <p className="text-sm opacity-80">Gerencie sua equipe e produtividade</p>
            </div>
          </div>
        </div>
        <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-sm">
          © {new Date().getFullYear()} BeautyManager - Todos os direitos reservados
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
            </TabsList>
            
            {/* Login Content */}
            <TabsContent value="login">
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold text-zinc-900 mb-6 text-center">
                    Acesso ao Sistema
                  </h2>
                  
                  {/* Removed role selection buttons as they are not used in login */}
                  
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu e-mail" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Sua senha" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Entrando..." : "Entrar"}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="mt-4 text-center">
                    <a href="#" className="text-primary text-sm hover:underline">
                      Esqueceu sua senha?
                    </a>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Register Content */}
            <TabsContent value="register">
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold text-zinc-900 mb-6 text-center">
                    Cadastro
                  </h2>
                  
                  <div className="flex gap-4 mb-6">
                    <Button
                      type="button"
                      variant={registerTab === "admin" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setRegisterTab("admin")}
                    >
                      Administrador
                    </Button>
                    <Button
                      type="button"
                      variant={registerTab === "collaborator" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setRegisterTab("collaborator")}
                    >
                      Colaborador
                    </Button>
                  </div>
                  
                  {/* Admin Registration Form */}
                  {registerTab === "admin" && (
                    <Form {...adminRegisterForm}>
                      <form onSubmit={adminRegisterForm.handleSubmit(onAdminRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={adminRegisterForm.control}
                          name="company.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome da Empresa</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome da sua empresa" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={adminRegisterForm.control}
                          name="user.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Seu Nome</FormLabel>
                              <FormControl>
                                <Input placeholder="Nome completo" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={adminRegisterForm.control}
                          name="user.email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail</FormLabel>
                              <FormControl>
                                <Input placeholder="Seu melhor e-mail" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={adminRegisterForm.control}
                          name="user.phone"
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
                        <FormField
                          control={adminRegisterForm.control}
                          name="user.password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Senha</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Crie uma senha segura" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={registerAdminMutation.isPending}
                        >
                          {registerAdminMutation.isPending ? "Criando Conta..." : "Criar Conta"}
                        </Button>
                      </form>
                    </Form>
                  )}
                  
                  {/* Collaborator Registration Form */}
                  {registerTab === "collaborator" && (
                    <Form {...collaboratorRegisterForm}>
                      <form onSubmit={collaboratorRegisterForm.handleSubmit(onCollaboratorRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={collaboratorRegisterForm.control}
                          name="inviteCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Código de Convite</FormLabel>
                              <FormControl>
                                <Input placeholder="Digite o código fornecido pelo administrador" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={collaboratorRegisterForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo</FormLabel>
                              <FormControl>
                                <Input placeholder="Seu nome completo" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={collaboratorRegisterForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>E-mail</FormLabel>
                              <FormControl>
                                <Input placeholder="Seu e-mail" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={collaboratorRegisterForm.control}
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
                        <FormField
                          control={collaboratorRegisterForm.control}
                          name="function"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Função</FormLabel>
                              <FormControl>
                                <Input placeholder="Exemplo: Barbeiro, Cabeleireiro, etc" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={collaboratorRegisterForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Senha</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Crie uma senha segura" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={registerCollaboratorMutation.isPending}
                        >
                          {registerCollaboratorMutation.isPending ? "Completando Cadastro..." : "Completar Cadastro"}
                        </Button>
                      </form>
                    </Form>
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
