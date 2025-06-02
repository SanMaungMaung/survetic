import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const token = localStorage.getItem('authToken');
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      if (!token) return null;
      
      // For Vercel deployment, add token as query parameter as fallback
      const isVercelDeployment = window.location.hostname.includes('vercel.app');
      let apiUrl = '/api/auth/user';
      if (isVercelDeployment) {
        apiUrl = `/api/auth/user?token=${encodeURIComponent(token)}`;
      }
      
      const response = await fetch(apiUrl, {
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
