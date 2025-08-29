
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EnhancedCryptoChart } from './enhanced-crypto-chart';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  name: string;
}

export function ChartModal({ isOpen, onClose, symbol, name }: ChartModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] w-full max-h-[98vh] overflow-y-auto p-2 sm:p-6">
        <DialogHeader className="px-4 pt-4 pb-0 sm:p-0">
          <DialogTitle className="sr-only">Advanced Trading Chart - {symbol}</DialogTitle>
          <DialogDescription className="sr-only">
            Professional trading chart with candlestick data, technical indicators, and real-time market analysis for {name}
          </DialogDescription>
        </DialogHeader>
        <div className="px-2 pb-2 sm:p-0">
          <EnhancedCryptoChart
            symbol={symbol}
            name={name}
            onClose={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
