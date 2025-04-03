import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User, Company, insertUserSchema } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type AuthContextType = {
  user: User | null;
  company: Company | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerAdminMutation: UseMutationResult<{ user: User; company: Company }, Error, AdminRegisterData>;
  registerCollaboratorMutation: UseMutationResult<{ user: User; company: Company }, Error, CollaboratorRegisterData>;
};

type LoginData = {
  email: string;
  password: string;
};

const adminUserSchema = insertUserSchema.pick({
  name: true,
  email: true,
  password: true,
  phone: true,
});

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
});

export type AdminRegisterData = {
  user: z.infer<typeof adminUserSchema>;
  company: z.infer<typeof companySchema>;
};

const collaboratorUserSchema = insertUserSchema.pick({
  name: true,
  email: true,
  password: true,
  phone: true,
  function: true,
});

export type CollaboratorRegisterData = z.infer<typeof collaboratorUserSchema> & {
  inviteCode: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error: userError,
    isLoading: isUserLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const {
    data: company,
    error: companyError,
    isLoading: isCompanyLoading,
  } = useQuery<Company | undefined, Error>({
    queryKey: ["/api/company"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (loggedInUser: User) => {
      queryClient.setQueryData(["/api/user"], loggedInUser);
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerAdminMutation = useMutation({
    mutationFn: async (data: AdminRegisterData) => {
      const res = await apiRequest("POST", "/api/register/admin", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data.user);
      queryClient.setQueryData(["/api/company"], data.company);
      toast({
        title: "Registration successful",
        description: "Your account has been created!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerCollaboratorMutation = useMutation({
    mutationFn: async (data: CollaboratorRegisterData) => {
      const res = await apiRequest("POST", "/api/register/collaborator", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/user"], data.user);
      queryClient.setQueryData(["/api/company"], data.company);
      toast({
        title: "Registration successful",
        description: "Your account has been created!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.setQueryData(["/api/company"], null);
      toast({
        title: "Logout successful",
        description: "You have been logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        company: company ?? null,
        isLoading: isUserLoading || isCompanyLoading,
        error: userError || companyError || null,
        loginMutation,
        logoutMutation,
        registerAdminMutation,
        registerCollaboratorMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
