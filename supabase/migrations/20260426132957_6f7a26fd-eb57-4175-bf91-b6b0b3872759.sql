-- Insert default api_kill_switch setting (enabled = true means APIs are KILLED / disabled)
INSERT INTO public.admin_settings (setting_key, setting_value, updated_at)
VALUES ('api_kill_switch', '{"enabled": true}'::jsonb, NOW())
ON CONFLICT (setting_key) DO NOTHING;

-- Update public read function to include kill switch
CREATE OR REPLACE FUNCTION public.get_public_admin_settings()
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT json_build_object(
    'upi_details', (SELECT setting_value FROM admin_settings WHERE setting_key = 'upi_details'),
    'bank_details', (SELECT setting_value FROM admin_settings WHERE setting_key = 'bank_details'),
    'usdt_details', (SELECT setting_value FROM admin_settings WHERE setting_key = 'usdt_details'),
    'api_kill_switch', (SELECT setting_value FROM admin_settings WHERE setting_key = 'api_kill_switch')
  );
$function$;

-- Lightweight function for edge functions / anon to check kill switch fast
CREATE OR REPLACE FUNCTION public.get_api_kill_switch()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT (setting_value->>'enabled')::boolean
     FROM admin_settings WHERE setting_key = 'api_kill_switch'),
    false
  );
$function$;

GRANT EXECUTE ON FUNCTION public.get_api_kill_switch() TO anon, authenticated;