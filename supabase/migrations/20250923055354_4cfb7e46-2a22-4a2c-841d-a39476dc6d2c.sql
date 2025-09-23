-- Update trade_type constraint to allow more trade types including admin adjustments
ALTER TABLE public.trades DROP CONSTRAINT trades_trade_type_check;

-- Add new constraint with expanded trade types
ALTER TABLE public.trades ADD CONSTRAINT trades_trade_type_check 
CHECK (trade_type = ANY (ARRAY['buy'::text, 'sell'::text, 'adjustment'::text, 'admin_credit'::text, 'deposit'::text, 'withdrawal'::text]));