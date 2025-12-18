
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type PublicUPI = {
  upi_id?: string;
  qr_code?: string;
  instructions?: string[];
};

type PublicBank = {
  account_holder?: string;
  bank_name?: string;
  account_number?: string;
  ifsc?: string;
  instructions?: string[];
};

type PublicUSDT = {
  wallet_address?: string;
  network?: string;
  instructions?: string[];
};

type PublicAdminSettings = {
  upi_details?: PublicUPI;
  bank_details?: PublicBank;
  usdt_details?: PublicUSDT;
};

export function useAdminSettings() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-settings-public"],
    queryFn: async (): Promise<PublicAdminSettings | null> => {
      console.log("Fetching public admin settings...");
      
      // Fetch all admin settings
      const { data: settings, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value');
      
      if (error) throw error;
      
      // Transform array to object
      const result: PublicAdminSettings = {};
      settings?.forEach((setting) => {
        if (setting.setting_key === 'upi_details') {
          result.upi_details = setting.setting_value as unknown as PublicUPI;
        } else if (setting.setting_key === 'bank_details') {
          result.bank_details = setting.setting_value as unknown as PublicBank;
        } else if (setting.setting_key === 'usdt_details') {
          result.usdt_details = setting.setting_value as unknown as PublicUSDT;
        }
      });
      
      console.log("Public admin settings:", result);
      return result;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  return { settings: data || undefined, isLoading, error, refetch };
}
