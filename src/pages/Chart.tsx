
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BinanceChart } from '@/components/charts/BinanceChart';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Chart() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [cryptoName, setCryptoName] = useState('');
  const [isValidSymbol, setIsValidSymbol] = useState(true);
  const isMobile = useIsMobile();

  const cryptoMapping: { [key: string]: string } = {
    'BTCUSDT': 'Bitcoin',
    'ETHUSDT': 'Ethereum', 
    'BNBUSDT': 'BNB',
    'ADAUSDT': 'Cardano',
    'SOLUSDT': 'Solana',
    'USDTUSDT': 'Tether',
    'XRPUSDT': 'Ripple',
    'DOTUSDT': 'Polkadot',
    'LINKUSDT': 'Chainlink',
    'LTCUSDT': 'Litecoin'
  };

  useEffect(() => {
    if (symbol) {
      // Validate symbol format
      if (!symbol.match(/^[A-Z]+USDT$/)) {
        setIsValidSymbol(false);
        return;
      }
      
      setCryptoName(cryptoMapping[symbol] || symbol.replace('USDT', ''));
      setIsValidSymbol(true);
    }
  }, [symbol]);

  const handleBack = () => {
    navigate(-1);
  };

  if (!symbol) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md">
          <AlertCircle className={`mx-auto mb-4 text-red-400 ${isMobile ? 'h-12 w-12' : 'h-16 w-16'}`} />
          <h1 className={`font-bold mb-4 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>Symbol Not Found</h1>
          <p className={`text-gray-400 mb-6 ${isMobile ? 'text-sm' : ''}`}>The requested trading symbol was not provided.</p>
          <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700" size={isMobile ? 'sm' : 'default'}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!isValidSymbol) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md">
          <AlertCircle className={`mx-auto mb-4 text-yellow-400 ${isMobile ? 'h-12 w-12' : 'h-16 w-16'}`} />
          <h1 className={`font-bold mb-4 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>Invalid Symbol</h1>
          <p className={`text-gray-400 mb-2 ${isMobile ? 'text-sm' : ''}`}>The symbol "{symbol}" is not a valid trading pair.</p>
          <p className={`text-gray-500 mb-6 ${isMobile ? 'text-xs' : 'text-sm'}`}>Please use format like BTCUSDT, ETHUSDT, etc.</p>
          <div className={`flex gap-3 justify-center ${isMobile ? 'flex-col' : ''}`}>
            <Button onClick={handleBack} variant="outline" size={isMobile ? 'sm' : 'default'}>
              <ArrowLeft className={`mr-2 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              Go Back
            </Button>
            <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700" size={isMobile ? 'sm' : 'default'}>
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Mobile-optimized Header */}
      <div className="sticky top-0 z-10 bg-black/95 backdrop-blur border-b border-gray-700">
        <div className={`container mx-auto px-4 ${isMobile ? 'py-2' : 'py-4'}`}>
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="text-white hover:bg-gray-800 flex items-center gap-2"
              size={isMobile ? 'sm' : 'default'}
            >
              <ArrowLeft className={isMobile ? 'h-4 w-4' : 'h-5 w-5'} />
              {isMobile ? 'Back' : 'Back to Dashboard'}
            </Button>
            
            {!isMobile && (
              <div className="text-center">
                <h1 className="text-xl font-bold text-white">Professional Trading Chart</h1>
                <p className="text-sm text-gray-400">Powered by Binance API</p>
              </div>
            )}
            
            <div className={isMobile ? 'w-12' : 'w-32'}></div> {/* Spacer for centering */}
          </div>
          
          {isMobile && (
            <div className="text-center mt-2">
              <h1 className="text-lg font-bold text-white">Professional Chart</h1>
              <p className="text-xs text-gray-400">Powered by Binance API</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Chart Container */}
      <div className={`container mx-auto ${isMobile ? 'px-2 py-2' : 'px-4 py-6'}`}>
        <BinanceChart
          symbol={symbol}
          name={cryptoName}
          onClose={handleBack}
          isFullPage={true}
        />
      </div>
    </div>
  );
}
