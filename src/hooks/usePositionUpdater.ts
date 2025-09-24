import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTaapiPrices } from './useTaapiPrices';

export const usePositionUpdater = (userId?: string) => {
  const queryClient = useQueryClient();

  // Get symbols from positions first
  const [symbolsToUpdate, setSymbolsToUpdate] = useState<string[]>([]);
  
  // Get symbols from positions
  useEffect(() => {
    if (!userId) return;
    
    const fetchSymbols = async () => {
      const { data: positions } = await supabase
        .from('portfolio_positions')
        .select('symbol')
        .eq('user_id', userId)
        .eq('status', 'open');
      
      if (positions) {
        setSymbolsToUpdate(positions.map(p => p.symbol));
      }
    };
    
    fetchSymbols();
  }, [userId]);

  const { prices } = useTaapiPrices(symbolsToUpdate);

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
          // Skip if this position has admin price override - don't update with live prices
          if (position.admin_price_override) {
            console.log(`Skipping position ${position.id} - admin price override active`);
            return;
          }
          
          const livePriceData = prices[position.symbol];
          if (!livePriceData) return;

          // Use INR price directly from TAAPI
          const livePriceINR = livePriceData.priceINR;
          
          // Only update if price has changed significantly (more than 0.1%)
          const priceDiff = Math.abs(position.current_price - livePriceINR);
          if (priceDiff < livePriceINR * 0.001) return;

          // Only update current_price - let database triggers handle derived fields
          return supabase
            .from('portfolio_positions')
            .update({
              current_price: livePriceINR,
              updated_at: new Date().toISOString(),
            })
            .eq('id', position.id)
            .eq('admin_price_override', false); // Double check admin override hasn't been set
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