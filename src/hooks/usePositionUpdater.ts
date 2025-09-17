import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealTimePrices } from './useRealTimePrices';

export const usePositionUpdater = (userId?: string) => {
  const { prices } = useRealTimePrices();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId || !prices || Object.keys(prices).length === 0) return;

    const updatePositions = async () => {
      try {
        // Get all open positions
        const { data: positions, error } = await supabase
          .from('portfolio_positions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'open');

        if (error || !positions) return;

        // Update each position with live prices
        const updates = positions.map(async (position) => {
          const livePrice = prices[position.symbol]?.price;
          if (!livePrice) return;

          // Convert to INR (multiply by exchange rate)
          const livePriceINR = livePrice * 84;
          
          // Only update if price has changed significantly (more than 0.1%)
          const priceDiff = Math.abs(position.current_price - livePriceINR);
          if (priceDiff < livePriceINR * 0.001) return;

          const currentValue = position.amount * livePriceINR;
          let pnl = currentValue - position.total_investment;
          let pnlPercentage = position.total_investment > 0 
            ? (pnl / position.total_investment) * 100 
            : 0;

          // Apply admin adjustment if present
          if (position.admin_adjustment_pct) {
            pnlPercentage += position.admin_adjustment_pct;
            pnl = (pnlPercentage / 100) * position.total_investment;
          }

          return supabase
            .from('portfolio_positions')
            .update({
              current_price: livePriceINR,
              current_value: currentValue,
              pnl: pnl,
              pnl_percentage: pnlPercentage,
              updated_at: new Date().toISOString(),
            })
            .eq('id', position.id);
        });

        await Promise.all(updates.filter(Boolean));
        
        // Invalidate queries to refresh UI across clients
        queryClient.invalidateQueries({ queryKey: ['portfolio-positions'] });
        queryClient.invalidateQueries({ queryKey: ['my-trades'] });
      } catch (error) {
        console.error('Error updating positions:', error);
      }
    };

    // Update immediately and then every 30 seconds
    updatePositions();
    const interval = setInterval(updatePositions, 5000);

    return () => clearInterval(interval);
  }, [userId, prices, queryClient]);
};