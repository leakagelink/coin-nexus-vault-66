
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceDisplayProps {
  price: number;
  change: number;
  changePercent: number;
  symbol: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function PriceDisplay({ 
  price, 
  change, 
  changePercent, 
  symbol,
  size = "md",
  showIcon = true,
  className 
}: PriceDisplayProps) {
  const isPositive = change >= 0;
  
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl font-semibold"
  };
  
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className={cn("font-mono", sizeClasses[size])}>
        ₹{price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
      </div>
      <div className={cn(
        "flex items-center gap-1 text-sm",
        isPositive ? "text-success" : "text-danger"
      )}>
        {showIcon && (
          isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
        )}
        <span>
          {isPositive ? "+" : ""}₹{Math.abs(change).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </span>
        <span>
          ({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}
