
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;
  if (!data) return null;

  const change = data.close - data.open;
  const changePercent = ((change / data.open) * 100);
  const isPositive = change >= 0;

  return (
    <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl min-w-[200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
        <p className="text-sm font-medium text-foreground">{data.time}</p>
        <div className={`flex items-center gap-1 text-xs font-medium ${
          isPositive ? 'text-green-500' : 'text-red-500'
        }`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {changePercent.toFixed(2)}%
        </div>
      </div>

      {/* OHLC Data */}
      <div className="space-y-2 text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Open:</span>
            <span className="font-mono text-foreground">${data.open?.toFixed(4) || '0.0000'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">High:</span>
            <span className="font-mono text-green-500">${data.high?.toFixed(4) || '0.0000'}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Low:</span>
            <span className="font-mono text-red-500">${data.low?.toFixed(4) || '0.0000'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Close:</span>
            <span className={`font-mono ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              ${data.close?.toFixed(4) || '0.0000'}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="pt-2 border-t border-border/30">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Volume:</span>
            <span className="font-mono text-muted-foreground">
              {data.volume ? `${(data.volume / 1000000).toFixed(2)}M` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Technical Indicators */}
        {(data.sma20 || data.sma50 || data.rsi) && (
          <div className="pt-2 border-t border-border/30 space-y-1">
            {data.sma20 && (
              <div className="flex justify-between">
                <span className="text-orange-500">SMA 20:</span>
                <span className="font-mono text-orange-500">${data.sma20.toFixed(4)}</span>
              </div>
            )}
            {data.sma50 && (
              <div className="flex justify-between">
                <span className="text-blue-500">SMA 50:</span>
                <span className="font-mono text-blue-500">${data.sma50.toFixed(4)}</span>
              </div>
            )}
            {data.rsi && (
              <div className="flex justify-between">
                <span className="text-purple-500">RSI:</span>
                <span className="font-mono text-purple-500">{data.rsi.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
