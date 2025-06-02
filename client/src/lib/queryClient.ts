import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem('authToken');
  const headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  // For Vercel deployment, add token as query parameter as fallback
  const isVercelDeployment = window.location.hostname.includes('vercel.app');
  let apiUrl = url;
  if (isVercelDeployment && token) {
    const separator = url.includes('?') ? '&' : '?';
    apiUrl = `${url}${separator}token=${encodeURIComponent(token)}`;
  }
  
  const res = await fetch(apiUrl, {
    method,
    headers,
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
    const token = localStorage.getItem('authToken');
    const isVercelDeployment = window.location.hostname.includes('vercel.app');
    
    const headers: HeadersInit = {};
    
    // Add auth headers
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Use correct URL with query parameter fallback for Vercel
    const url = queryKey[0] as string;
    let apiUrl = url;
    if (isVercelDeployment && token) {
      const separator = url.includes('?') ? '&' : '?';
      apiUrl = `${url}${separator}token=${encodeURIComponent(token)}`;
    }
    
    const res = await fetch(apiUrl, {
      method: "GET",
      credentials: "include",
      headers,
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
