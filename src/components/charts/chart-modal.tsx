
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
      <DialogContent className="w-[98vw] sm:max-w-[1400px] max-h-[98vh] p-2 sm:p-4">
        <DialogHeader className="px-2 pt-2 pb-0 sm:p-0">
          <DialogTitle className="sr-only">Advanced Trading Chart - {symbol}</DialogTitle>
          <DialogDescription className="sr-only">
            Professional trading chart with candlestick data, technical indicators, and real-time market analysis for {name}
          </DialogDescription>
        </DialogHeader>
        <div className="w-full h-[75vh] sm:h-[80vh]">
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
