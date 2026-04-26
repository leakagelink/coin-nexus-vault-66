import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Global API Kill Switch.
 * When enabled = true, the entire app must:
 *  - stop calling any external price API (Binance / CMC / Taapi / LCW)
 *  - stop computing momentum / live PnL movements
 *  - freeze positions at their entry / stored price (real-market unlinked)
 *
 * Controlled from the Admin Panel > Settings.
 */
export function useApiKillSwitch() {
  const { data, isLoading } = useQuery({
    queryKey: ["api-kill-switch"],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc("get_api_kill_switch");
      if (error) {
        console.warn("[kill-switch] read failed, defaulting to ENABLED (safe)", error);
        return true;
      }
      return Boolean(data);
    },
    // Re-check every 15s so toggle propagates quickly across the app
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
  });

  // Default to enabled (killed) until we know otherwise — fail-safe.
  return { killed: data ?? true, isLoading };
}

/**
 * Imperative read for non-React contexts (hooks fetching outside render).
 * Cached for 5s to avoid hammering the DB.
 */
let cachedKilled: boolean | null = null;
let cachedAt = 0;
const CACHE_MS = 5_000;

export async function readApiKillSwitch(): Promise<boolean> {
  const now = Date.now();
  if (cachedKilled !== null && now - cachedAt < CACHE_MS) {
    return cachedKilled;
  }
  try {
    const { data, error } = await supabase.rpc("get_api_kill_switch");
    if (error) {
      cachedKilled = true;
    } else {
      cachedKilled = Boolean(data);
    }
  } catch {
    cachedKilled = true;
  }
  cachedAt = now;
  return cachedKilled;
}

export function invalidateKillSwitchCache() {
  cachedKilled = null;
  cachedAt = 0;
}