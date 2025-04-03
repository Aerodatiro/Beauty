import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Tenta fazer o parse do corpo da resposta como JSON
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await res.json();
        
        // Se for um erro de validação do Zod, formata a mensagem de erro
        if (errorData.message && errorData.message.includes('Validation error')) {
          console.error('Erro de validação:', errorData);
          
          // Verificar problemas específicos de tipo de dados
          if (errorData.message.includes('"expected": "date"') || 
              errorData.message.includes('"expected": "number"')) {
            console.error('Erro de tipo de dados. Verifique se os tipos estão corretos antes do envio:', errorData);
            throw new Error('Erro de validação: Formato de dados incorreto. Verifique se as datas e números estão no formato correto.');
          }
          
          throw new Error(errorData.message || 'Erro de validação');
        }
        throw new Error(errorData.message || `Erro ${res.status}: ${res.statusText}`);
      } else {
        // Não é JSON, então usa o corpo como texto
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
    } catch (e) {
      // Se o parse falhar, usa o erro original
      if (e instanceof Error) {
        throw e;
      }
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
