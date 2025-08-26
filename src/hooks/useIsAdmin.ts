
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useIsAdmin() {
  const { user } = useAuth();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile-role", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      console.log("Fetched profile role:", data?.role);
      return data;
    },
    enabled: !!user,
    // Ensure fresh role after promotion
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const isAdmin = profile?.role === "admin";

  return { isAdmin, isLoading, error };
}
