import { useMemo, useRef } from "react";
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
 * For admin-adjusted positions: disconnects from live market and simulates momentum around the set P&L
 * This is for display purposes only
 */
export function usePositionCalculations(
  positions: Position[] | undefined,
  livePrices: Record<string, PriceData>
) {
  // Track simulated momentum for admin-adjusted positions
  const simulatedMomentumRef = useRef<Record<string, { offset: number; direction: number; lastUpdate: number }>>({});

  return useMemo(() => {
    if (!positions) return [];

    return positions.map(position => {
      // Check if this position has admin override
      const hasAdminOverride = position.admin_price_override === true;

      let livePrice: number;
      let simulatedMomentum = 0;
      let simulatedDirection = 1;

      if (hasAdminOverride) {
        // For admin-adjusted positions: DO NOT use live market price
        // Instead, simulate small momentum fluctuations (±0.5% to ±2%) around the admin-set price
        const positionId = position.id;
        const now = Date.now();
        
        if (!simulatedMomentumRef.current[positionId]) {
          // Initialize with random offset
          simulatedMomentumRef.current[positionId] = {
            offset: (Math.random() - 0.5) * 4, // -2% to +2%
            direction: Math.random() > 0.5 ? 1 : -1,
            lastUpdate: now
          };
        }

        const simData = simulatedMomentumRef.current[positionId];
        
        // Update momentum every ~2-3 seconds with small changes
        if (now - simData.lastUpdate > 2000) {
          // Random walk within bounds
          const change = (Math.random() - 0.4) * 1.5 * simData.direction; // Slight bias in current direction
          simData.offset = Math.max(-3, Math.min(3, simData.offset + change));
          
          // Occasionally reverse direction
          if (Math.random() < 0.2) {
            simData.direction *= -1;
          }
          simData.lastUpdate = now;
        }

        // Apply simulated offset to the admin-set price
        const adminSetPrice = Number(position.current_price);
        const priceVariation = adminSetPrice * (simData.offset / 100);
        livePrice = adminSetPrice + priceVariation;
        
        simulatedMomentum = Math.abs(simData.offset);
        simulatedDirection = simData.offset >= 0 ? 1 : -1;
      } else {
        // For normal positions: use live market price
        livePrice = livePrices[position.symbol]?.priceINR || position.current_price;
      }

      const currentValue = position.amount * livePrice;
      let pnl = currentValue - position.total_investment;
      let pnlPercentage = position.total_investment > 0 
        ? (pnl / position.total_investment) * 100 
        : 0;

      // Apply admin adjustment if present (legacy support)
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
        // Add simulated momentum data for admin-adjusted positions
        _isAdminAdjusted: hasAdminOverride,
        _simulatedMomentum: simulatedMomentum,
        _simulatedDirection: simulatedDirection,
      };
    });
  }, [positions, livePrices]);
}
