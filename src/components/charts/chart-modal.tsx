
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ProfessionalTradingChart } from './professional-trading-chart';

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
          <DialogTitle className="sr-only">Professional Trading Chart - {symbol}</DialogTitle>
          <DialogDescription className="sr-only">
            Professional Binance-style trading chart with real candlestick data, momentum indicators, and technical analysis for {name}
          </DialogDescription>
        </DialogHeader>
        <div className="w-full h-[75vh] sm:h-[80vh]">
          <ProfessionalTradingChart
            symbol={symbol}
            name={name}
            onClose={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
