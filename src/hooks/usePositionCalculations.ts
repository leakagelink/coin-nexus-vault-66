import { useMemo } from "react";
import { PriceData } from "./usePriceData";

export type Position = {
  id: string;
  symbol: string;
  coin_name: string;
  amount: number;
  buy_price: number;
  current_price: number;
  total_investment: number;
  current_value: number;
  pnl: number;
  pnl_percentage: number;
  admin_adjustment_pct?: number;
  admin_price_override?: boolean;
  position_type?: string;
  status?: string;
  created_at?: string;
};

/**
 * Calculates live P&L for positions without modifying database
 * This is for display purposes only
 */
export function usePositionCalculations(
  positions: Position[] | undefined,
  livePrices: Record<string, PriceData>
) {
  return useMemo(() => {
    if (!positions) return [];

    return positions.map(position => {
      // Use admin override price if set, otherwise use live price
      const livePrice = position.admin_price_override 
        ? position.current_price
        : (livePrices[position.symbol]?.priceINR || position.current_price);

      const currentValue = position.amount * livePrice;
      let pnl = currentValue - position.total_investment;
      let pnlPercentage = position.total_investment > 0 
        ? (pnl / position.total_investment) * 100 
        : 0;

      // Apply admin adjustment if present
      if (position.admin_adjustment_pct) {
        pnlPercentage += position.admin_adjustment_pct;
        pnl = (pnlPercentage / 100) * position.total_investment;
      }

      return {
        ...position,
        current_price: livePrice,
        current_value: currentValue,
        pnl,
        pnl_percentage: pnlPercentage,
      };
    });
  }, [positions, livePrices]);
}
