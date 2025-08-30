
import { Line, ReferenceLine } from 'recharts';

export interface IndicatorProps {
  data: any[];
  indicators: {
    sma20: boolean;
    sma50: boolean;
    rsi: boolean;
    macd: boolean;
    bollinger: boolean;
  };
}

export function ChartIndicators({ data, indicators }: IndicatorProps) {
  return (
    <>
      {/* SMA 20 - Orange line */}
      {indicators.sma20 && (
        <Line
          type="monotone"
          dataKey="sma20"
          stroke="#ff9500"
          strokeWidth={2}
          dot={false}
          strokeDasharray="none"
          connectNulls={false}
          name="SMA 20"
        />
      )}
      
      {/* SMA 50 - Blue line */}
      {indicators.sma50 && (
        <Line
          type="monotone"
          dataKey="sma50"
          stroke="#007aff"
          strokeWidth={2}
          dot={false}
          strokeDasharray="none"
          connectNulls={false}
          name="SMA 50"
        />
      )}

      {/* Bollinger Bands */}
      {indicators.bollinger && (
        <>
          <Line
            type="monotone"
            dataKey="bbUpper"
            stroke="#34c759"
            strokeWidth={1}
            dot={false}
            strokeDasharray="3 3"
            connectNulls={false}
            name="BB Upper"
          />
          <Line
            type="monotone"
            dataKey="bbLower"
            stroke="#34c759"
            strokeWidth={1}
            dot={false}
            strokeDasharray="3 3"
            connectNulls={false}
            name="BB Lower"
          />
        </>
      )}
    </>
  );
}

export function RSIChart({ data, isVisible }: { data: any[], isVisible: boolean }) {
  if (!isVisible || !data.length) return null;

  return (
    <div className="h-32 w-full bg-background/50 rounded-lg border p-2">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-foreground">RSI (14)</h4>
        <span className="text-xs text-muted-foreground font-mono">
          {data[data.length - 1]?.rsi?.toFixed(1) || '50.0'}
        </span>
      </div>
      <div className="h-20 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-red-500/30" style={{ top: '20%' }} />
          <div className="w-full h-px bg-green-500/30" style={{ top: '80%' }} />
        </div>
        <svg className="w-full h-full">
          <polyline
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            points={data.map((item, index) => 
              `${(index / (data.length - 1)) * 100}%,${100 - (item.rsi || 50)}%`
            ).join(' ')}
          />
        </svg>
      </div>
    </div>
  );
}
