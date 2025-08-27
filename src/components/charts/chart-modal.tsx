
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { CryptoChart } from './crypto-chart';

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  name: string;
}

export function ChartModal({ isOpen, onClose, symbol, name }: ChartModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto p-0 sm:p-6">
        <DialogHeader className="px-6 pt-6 pb-0 sm:p-0">
          <DialogTitle className="sr-only">Price Chart - {symbol}</DialogTitle>
          <DialogDescription className="sr-only">
            View detailed price history and trends for {name}
          </DialogDescription>
        </DialogHeader>
        <div className="px-2 pb-2 sm:p-0">
          <CryptoChart
            symbol={symbol}
            name={name}
            onClose={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
