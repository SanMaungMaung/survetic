import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const token = localStorage.getItem('authToken');
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      if (!token) return null;
      
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        localStorage.removeItem('authToken');
        return null;
      }
      
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchInterval: false,
    staleTime: 1000,
    enabled: !!token,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !!token && !error,
  };
}
