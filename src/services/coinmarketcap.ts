
interface CoinMarketCapQuote {
  USD: {
    price: number;
    percent_change_24h: number;
    market_cap: number;
    volume_24h: number;
    last_updated: string;
  };
}

interface CoinMarketCapCrypto {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  quote: CoinMarketCapQuote;
}

interface CoinMarketCapResponse {
  data: CoinMarketCapCrypto[];
  status: {
    timestamp: string;
    error_code: number;
    error_message: string;
    elapsed: number;
    credit_count: number;
  };
}

export interface CMCPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
}

class CoinMarketCapService {
  private apiKey = '8bf7f0bd-1180-4bc4-9380-07b4d49bd233';
  private baseUrl = 'https://pro-api.coinmarketcap.com/v1';

  // Popular crypto symbols to fetch
  private cryptoSymbols = ['BTC', 'ETH', 'BNB', 'ADA', 'SOL', 'USDT'];

  async getCryptoPrices(): Promise<CMCPrice[]> {
    try {
      const symbolsParam = this.cryptoSymbols.join(',');
      const response = await fetch(
        `${this.baseUrl}/cryptocurrency/quotes/latest?symbol=${symbolsParam}`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': this.apiKey,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CoinMarketCapResponse = await response.json();

      if (data.status.error_code !== 0) {
        throw new Error(data.status.error_message);
      }

      return Object.values(data.data).map((crypto) => ({
        symbol: crypto.symbol,
        name: crypto.name,
        price: crypto.quote.USD.price,
        change24h: crypto.quote.USD.percent_change_24h,
        marketCap: crypto.quote.USD.market_cap,
        volume24h: crypto.quote.USD.volume_24h,
      }));
    } catch (error) {
      console.error('Error fetching data from CoinMarketCap:', error);
      throw error;
    }
  }

  async getCryptoPrice(symbol: string): Promise<CMCPrice> {
    try {
      const response = await fetch(
        `${this.baseUrl}/cryptocurrency/quotes/latest?symbol=${symbol}`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': this.apiKey,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CoinMarketCapResponse = await response.json();

      if (data.status.error_code !== 0) {
        throw new Error(data.status.error_message);
      }

      const crypto = data.data[0];
      return {
        symbol: crypto.symbol,
        name: crypto.name,
        price: crypto.quote.USD.price,
        change24h: crypto.quote.USD.percent_change_24h,
        marketCap: crypto.quote.USD.market_cap,
        volume24h: crypto.quote.USD.volume_24h,
      };
    } catch (error) {
      console.error('Error fetching crypto price from CoinMarketCap:', error);
      throw error;
    }
  }
}

export const coinMarketCapService = new CoinMarketCapService();
