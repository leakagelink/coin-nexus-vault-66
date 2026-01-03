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
 * For admin-adjusted positions: disconnects from live market and uses admin_adjustment_pct as the P&L %
 * with simulated momentum (±2-3%) around that value
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
      const adminPct = Number(position.admin_adjustment_pct) || 0;

      let displayPnlPercentage: number;
      let simulatedMomentum = 0;
      let simulatedDirection = 1;

      if (hasAdminOverride && adminPct !== 0) {
        // For admin-adjusted positions: P&L is ENTIRELY controlled by admin_adjustment_pct
        // Plus simulated momentum of ±2-3% around that value
        const positionId = position.id;
        const now = Date.now();
        
        if (!simulatedMomentumRef.current[positionId]) {
          // Initialize with random offset
          simulatedMomentumRef.current[positionId] = {
            offset: (Math.random() - 0.5) * 4, // -2% to +2%
            direction: adminPct >= 0 ? 1 : -1, // Bias in direction of admin adjustment
            lastUpdate: now
          };
        }

        const simData = simulatedMomentumRef.current[positionId];
        
        // Update momentum every ~2-3 seconds with small changes
        if (now - simData.lastUpdate > 2000) {
          // Random walk within bounds, biased towards admin direction
          const directionBias = adminPct >= 0 ? 0.6 : 0.4;
          const change = (Math.random() - directionBias) * 1.5 * simData.direction;
          simData.offset = Math.max(-3, Math.min(3, simData.offset + change));
          
          // Occasionally reverse direction
          if (Math.random() < 0.15) {
            simData.direction *= -1;
          }
          simData.lastUpdate = now;
        }

        // P&L % = admin set value + small simulated momentum
        displayPnlPercentage = adminPct + simData.offset;
        
        simulatedMomentum = Math.abs(simData.offset);
        simulatedDirection = displayPnlPercentage >= 0 ? 1 : -1;
      } else {
        // For normal positions: use live market price
        const livePrice = livePrices[position.symbol]?.priceINR || position.current_price;
        const currentValue = position.amount * livePrice;
        const pnl = currentValue - position.total_investment;
        displayPnlPercentage = position.total_investment > 0 
          ? (pnl / position.total_investment) * 100 
          : 0;
      }

      // Calculate display values based on P&L percentage
      const displayPnl = (displayPnlPercentage / 100) * position.total_investment;
      const displayCurrentValue = position.total_investment + displayPnl;
      const displayCurrentPrice = position.amount > 0 
        ? displayCurrentValue / position.amount 
        : position.buy_price;

      return {
        ...position,
        current_price: displayCurrentPrice,
        current_value: displayCurrentValue,
        pnl: displayPnl,
        pnl_percentage: displayPnlPercentage,
        // Add simulated momentum data for admin-adjusted positions
        _isAdminAdjusted: hasAdminOverride && adminPct !== 0,
        _simulatedMomentum: simulatedMomentum,
        _simulatedDirection: simulatedDirection,
      };
    });
  }, [positions, livePrices]);
}
