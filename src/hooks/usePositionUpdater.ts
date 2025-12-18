import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { binanceAPI } from '@/services/binanceApi';

/**
 * Background updater that syncs database positions with live prices
 * This runs independently and doesn't affect UI display
 */
export const usePositionUpdater = (userId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const updatePositions = async () => {
      try {
        // Get all open positions
        const { data: positions, error } = await supabase
          .from('portfolio_positions')
          .select('*')
          .eq('user_id', userId);

        if (error || !positions || positions.length === 0) return;

        // Get unique symbols and convert to Binance format (add USDT)
        const symbols = Array.from(new Set(positions.map(p => `${p.symbol}USDT`)));
        
        // Fetch prices from Binance for all symbols in parallel
        const pricePromises = symbols.map(async (symbol) => {
          try {
            const priceData = await binanceAPI.getPrice(symbol);
            const priceUSD = parseFloat(priceData.price);
            const priceINR = priceUSD * 84;
            const cleanSymbol = symbol.replace('USDT', '');
            return { symbol: cleanSymbol, priceINR };
          } catch (e) {
            console.error(`Failed to fetch Binance price for ${symbol}:`, e);
            return null;
          }
        });

        const priceResults = await Promise.all(pricePromises);
        const priceMap: Record<string, number> = {};
        priceResults.forEach(result => {
          if (result) priceMap[result.symbol] = result.priceINR;
        });

        // Update positions in database
        const updates = positions.map(async (position) => {
          // For admin-overridden positions, add small fluctuation to simulate live movement
          if (position.admin_price_override) {
            const basePrice = position.current_price;
            // Add random fluctuation between -0.5% to +0.5% to keep it feeling live
            const fluctuation = (Math.random() - 0.5) * 0.01; // -0.5% to +0.5%
            const newPrice = basePrice * (1 + fluctuation);
            
            return supabase
              .from('portfolio_positions')
              .update({
                current_price: newPrice,
                updated_at: new Date().toISOString(),
              })
              .eq('id', position.id);
          }
          
          const livePriceINR = priceMap[position.symbol];
          if (!livePriceINR) return;

          // Only update if price changed significantly (>0.1%)
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
        
        // Only invalidate queries if we actually updated something
        if (updates.some(u => u !== undefined)) {
          queryClient.invalidateQueries({ queryKey: ['portfolio-positions'] });
        }
      } catch (error) {
        console.error('Error updating positions:', error);
      }
    };

    // Update every 10 seconds (less aggressive to prevent conflicts)
    const interval = setInterval(updatePositions, 10000);
    updatePositions(); // Initial update

    return () => clearInterval(interval);
  }, [userId, queryClient]);
};