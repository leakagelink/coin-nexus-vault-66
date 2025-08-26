
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type AdminSettingsMap = {
  upi_details?: any;
  bank_details?: any;
  usdt_details?: any;
};

export function useAdminSettings() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      console.log("Fetching admin settings...");
      const { data, error } = await supabase
        .from("admin_settings")
        .select("setting_key, setting_value");
      if (error) throw error;

      const map: AdminSettingsMap = {};
      (data || []).forEach((row: any) => {
        map[row.setting_key as keyof AdminSettingsMap] = row.setting_value;
      });

      console.log("Admin settings map:", map);
      return map;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  return { settings: data, isLoading, error, refetch };
}
