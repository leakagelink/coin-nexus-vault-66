
import React from 'react';

interface CandlestickProps {
  payload: any;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function CandlestickRenderer({ payload, x, y, width, height }: CandlestickProps) {
  if (!payload || typeof payload.open !== 'number') {
    return null;
  }

  const { open, high, low, close, volume } = payload;
  const isBullish = close >= open;
  
  // Professional trading colors
  const bullColor = '#0ecb81';  // Binance green
  const bearColor = '#f6465d';  // Binance red
  const color = isBullish ? bullColor : bearColor;
  
  // Calculate dimensions
  const candleWidth = Math.max(width * 0.7, 2);
  const wickWidth = Math.max(width * 0.1, 1);
  const centerX = x + width / 2;
  
  // Price calculations
  const priceRange = high - low;
  if (priceRange === 0) return null;
  
  const scale = height / priceRange;
  
  // Y positions (inverted because SVG coordinates)
  const highY = y;
  const lowY = y + height;
  const openY = y + ((high - open) / priceRange) * height;
  const closeY = y + ((high - close) / priceRange) * height;
  
  const bodyTop = Math.min(openY, closeY);
  const bodyBottom = Math.max(openY, closeY);
  const bodyHeight = Math.max(Math.abs(closeY - openY), 1);

  // Volume-based opacity for better visualization
  const volumeOpacity = Math.min(0.8, Math.max(0.4, (volume || 1000000) / 10000000));

  return (
    <g opacity={volumeOpacity}>
      {/* High-Low Wick */}
      <line
        x1={centerX}
        x2={centerX}
        y1={highY}
        y2={lowY}
        stroke={color}
        strokeWidth={wickWidth}
        opacity={0.8}
      />
      
      {/* Candle Body */}
      <rect
        x={centerX - candleWidth / 2}
        y={bodyTop}
        width={candleWidth}
        height={bodyHeight}
        fill={isBullish ? 'transparent' : color}
        stroke={color}
        strokeWidth={1.5}
        rx={0.5}
      />
      
      {/* Highlight for better visibility */}
      {bodyHeight > 3 && (
        <rect
          x={centerX - candleWidth / 2 + 1}
          y={bodyTop + 1}
          width={Math.max(candleWidth - 2, 1)}
          height={Math.max(bodyHeight - 2, 1)}
          fill="none"
          stroke={isBullish ? color : 'transparent'}
          strokeWidth={0.5}
          opacity={0.6}
        />
      )}
    </g>
  );
}
