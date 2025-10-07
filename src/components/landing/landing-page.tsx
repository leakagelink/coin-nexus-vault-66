import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, TrendingUp, Shield, Zap, Users, Star, Menu, X, Sparkles, Lock, Award, Headphones, CheckCircle, Phone, Mail, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getLatestTaapiPriceUSD } from "@/services/taapiProxy";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [cryptoPrices, setCryptoPrices] = useState({
    BTC: { price: 0, change: 0, momentum: 'neutral' as 'up' | 'down' | 'neutral', prevPrice: 0 },
    ETH: { price: 0, change: 0, momentum: 'neutral' as 'up' | 'down' | 'neutral', prevPrice: 0 },
    BNB: { price: 0, change: 0, momentum: 'neutral' as 'up' | 'down' | 'neutral', prevPrice: 0 }
  });
  const [priceFlash, setPriceFlash] = useState<{[key: string]: boolean}>({
    BTC: false,
    ETH: false,
    BNB: false
  });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchCryptoPrices = async () => {
      try {
        const [btcPrice, ethPrice, bnbPrice] = await Promise.all([
          getLatestTaapiPriceUSD('BTC', '1h'),
          getLatestTaapiPriceUSD('ETH', '1h'),
          getLatestTaapiPriceUSD('BNB', '1h')
        ]);

        setCryptoPrices(prev => {
          const newPrices = {
            BTC: {
              price: btcPrice,
              prevPrice: prev.BTC.price || btcPrice,
              change: prev.BTC.price ? ((btcPrice - prev.BTC.price) / prev.BTC.price) * 100 : 0,
              momentum: btcPrice > prev.BTC.price ? 'up' as const : btcPrice < prev.BTC.price ? 'down' as const : 'neutral' as const
            },
            ETH: {
              price: ethPrice,
              prevPrice: prev.ETH.price || ethPrice,
              change: prev.ETH.price ? ((ethPrice - prev.ETH.price) / prev.ETH.price) * 100 : 0,
              momentum: ethPrice > prev.ETH.price ? 'up' as const : ethPrice < prev.ETH.price ? 'down' as const : 'neutral' as const
            },
            BNB: {
              price: bnbPrice,
              prevPrice: prev.BNB.price || bnbPrice,
              change: prev.BNB.price ? ((bnbPrice - prev.BNB.price) / prev.BNB.price) * 100 : 0,
              momentum: bnbPrice > prev.BNB.price ? 'up' as const : bnbPrice < prev.BNB.price ? 'down' as const : 'neutral' as const
            }
          };

          // Trigger flash animation for changed prices
          const flash: {[key: string]: boolean} = {};
          (Object.keys(newPrices) as Array<keyof typeof newPrices>).forEach(key => {
            if (prev[key].price && newPrices[key].price !== prev[key].price) {
              flash[key] = true;
            }
          });
          
          if (Object.keys(flash).length > 0) {
            setPriceFlash(flash);
            setTimeout(() => setPriceFlash({ BTC: false, ETH: false, BNB: false }), 1000);
          }

          return newPrices;
        });
      } catch (error) {
        console.error('Error fetching crypto prices:', error);
      }
    };

    // Initial fetch
    fetchCryptoPrices();
    
    // Update every 10 seconds for live momentum
    const interval = setInterval(fetchCryptoPrices, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleAuthClick = (isLogin: boolean) => {
    // Navigate to a route that will trigger the AuthScreen
    navigate('/portfolio');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="glass border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/b0ad78d4-aa9f-4535-a7ec-d2f52a914912.png" 
                alt="Nadex" 
                className="w-8 h-8"
              />
              <h1 className="text-xl font-bold gradient-text">Nadex</h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => handleAuthClick(true)}
                className="hover:bg-primary/10"
              >
                Login
              </Button>
              <Button 
                onClick={() => handleAuthClick(false)}
                className="bg-gradient-primary"
              >
                Sign Up
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2 border-t border-border/50">
              <Button 
                variant="ghost" 
                onClick={() => handleAuthClick(true)}
                className="w-full justify-start hover:bg-primary/10"
              >
                Login
              </Button>
              <Button 
                onClick={() => handleAuthClick(false)}
                className="w-full bg-gradient-primary"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"
            style={{ transform: `translateY(${scrollY * 0.3}px)` }}
          />
          <div 
            className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s', transform: `translateY(${scrollY * 0.2}px)` }}
          />
        </div>

        <div className="text-center space-y-6 max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 animate-fade-in">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium">Trade Smarter, Not Harder</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text animate-fade-in animate-slide-up">
            Trade Cryptocurrency with Confidence
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Experience the future of crypto trading with real-time market data, 
            advanced analytics, and secure transactions on Nadex platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button 
              size="lg" 
              className="bg-gradient-primary text-lg px-8 hover-scale shadow-lg hover:shadow-xl transition-all"
              onClick={() => handleAuthClick(false)}
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 hover-scale hover:border-primary/50 transition-all"
              onClick={() => handleAuthClick(true)}
            >
              Login Now
            </Button>
          </div>
        </div>
      </section>

      {/* Live Crypto Prices Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold gradient-text mb-2">
            Live Market Prices
            <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </h2>
          <p className="text-muted-foreground">Real-time cryptocurrency prices with live momentum</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 max-w-4xl mx-auto">
          {Object.entries(cryptoPrices).map(([symbol, data], index) => (
            <Card 
              key={symbol}
              className={cn(
                "glass border-primary/20 hover:border-primary/40 transition-all hover-scale group cursor-pointer animate-fade-in relative overflow-hidden",
                priceFlash[symbol] && data.momentum === 'up' && "ring-2 ring-green-500/50",
                priceFlash[symbol] && data.momentum === 'down' && "ring-2 ring-red-500/50"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Momentum indicator background */}
              {data.momentum !== 'neutral' && (
                <div className={cn(
                  "absolute inset-0 opacity-5 transition-opacity",
                  data.momentum === 'up' ? "bg-green-500" : "bg-red-500",
                  priceFlash[symbol] && "opacity-20"
                )} />
              )}

              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold">{symbol}</h3>
                      {data.momentum === 'up' && (
                        <TrendingUp className="h-5 w-5 text-green-500 animate-bounce" />
                      )}
                      {data.momentum === 'down' && (
                        <TrendingUp className="h-5 w-5 text-red-500 rotate-180 animate-bounce" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {symbol === 'BTC' && 'Bitcoin'}
                      {symbol === 'ETH' && 'Ethereum'}
                      {symbol === 'BNB' && 'Binance Coin'}
                    </p>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded text-xs font-semibold transition-all",
                    data.change >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500",
                    priceFlash[symbol] && "scale-110"
                  )}>
                    {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
                  </div>
                </div>

                <div className="space-y-2">
                  <div className={cn(
                    "text-3xl font-bold gradient-text transition-all",
                    priceFlash[symbol] && "scale-105"
                  )}>
                    ${data.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ₹{(data.price * 84).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Live Momentum</span>
                    <span className={cn(
                      "font-semibold flex items-center gap-1",
                      data.momentum === 'up' && "text-green-500",
                      data.momentum === 'down' && "text-red-500"
                    )}>
                      {data.momentum === 'up' && '↑ Bullish'}
                      {data.momentum === 'down' && '↓ Bearish'}
                      {data.momentum === 'neutral' && '→ Stable'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button 
            size="lg"
            className="bg-gradient-primary hover-scale"
            onClick={() => handleAuthClick(false)}
          >
            Start Trading Now <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <Card className="glass border-primary/20 hover:border-primary/40 transition-all hover-scale animate-fade-in">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">SSL Secured</p>
                <p className="text-xs text-muted-foreground">256-bit Encryption</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20 hover:border-primary/40 transition-all hover-scale animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                <Lock className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">Licensed</p>
                <p className="text-xs text-muted-foreground">Regulated Platform</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20 hover:border-primary/40 transition-all hover-scale animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto">
                <Award className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">Insured</p>
                <p className="text-xs text-muted-foreground">Asset Protection</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20 hover:border-primary/40 transition-all hover-scale animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto">
                <Headphones className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">24/7 Support</p>
                <p className="text-xs text-muted-foreground">Always Available</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 bg-primary/5 rounded-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">Trusted by Traders Worldwide</h2>
          <p className="text-lg text-muted-foreground">Join our growing community of successful traders</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          <div className="text-center animate-fade-in">
            <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">10,000+</div>
            <p className="text-muted-foreground">Active Users</p>
          </div>

          <div className="text-center animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">$50M+</div>
            <p className="text-muted-foreground">Trading Volume</p>
          </div>

          <div className="text-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">25+</div>
            <p className="text-muted-foreground">Countries</p>
          </div>

          <div className="text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">99.9%</div>
            <p className="text-muted-foreground">Uptime</p>
          </div>
        </div>
      </section>

      {/* Features Section */}

      {/* Features Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <Card className="glass border-primary/20 hover:border-primary/40 transition-all hover-scale group cursor-pointer animate-fade-in">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-all group-hover:scale-110">
                <TrendingUp className="h-6 w-6 text-primary group-hover:rotate-12 transition-transform" />
              </div>
              <h3 className="text-xl font-semibold">Real-Time Trading</h3>
              <p className="text-muted-foreground">
                Access live market prices and execute trades instantly with our advanced trading platform
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20 hover:border-primary/40 transition-all hover-scale group cursor-pointer animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-all group-hover:scale-110">
                <Shield className="h-6 w-6 text-primary group-hover:rotate-12 transition-transform" />
              </div>
              <h3 className="text-xl font-semibold">Secure & Safe</h3>
              <p className="text-muted-foreground">
                Your assets are protected with bank-level security and encrypted transactions
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20 hover:border-primary/40 transition-all hover-scale group cursor-pointer animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-all group-hover:scale-110">
                <Zap className="h-6 w-6 text-primary group-hover:rotate-12 transition-transform" />
              </div>
              <h3 className="text-xl font-semibold">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Experience ultra-fast transaction processing and instant order execution
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About Us Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold gradient-text">About Nadex</h2>
          <p className="text-lg text-muted-foreground">
            Nadex is a cutting-edge cryptocurrency trading platform designed for both beginners and 
            experienced traders. We provide a seamless, secure, and user-friendly environment to trade 
            your favorite cryptocurrencies with confidence.
          </p>
          <p className="text-lg text-muted-foreground">
            Our mission is to democratize access to cryptocurrency markets by offering powerful tools, 
            real-time data, and educational resources that empower traders to make informed decisions. 
            With advanced security measures and 24/7 customer support, we ensure your trading experience 
            is safe and smooth.
          </p>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-primary/5 rounded-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">Why Choose Nadex?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of traders who trust Nadex for their cryptocurrency trading needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass border-primary/20 hover:border-primary/40 transition-all hover-scale group animate-fade-in">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-all group-hover:scale-110">
                <Users className="h-8 w-8 text-primary group-hover:animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold">10,000+ Users</h3>
              <p className="text-sm text-muted-foreground">
                Growing community of active traders
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20 hover:border-primary/40 transition-all hover-scale group animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-all group-hover:scale-110">
                <Shield className="h-8 w-8 text-primary group-hover:animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold">Bank-Level Security</h3>
              <p className="text-sm text-muted-foreground">
                Advanced encryption and protection
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20 hover:border-primary/40 transition-all hover-scale group animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-all group-hover:scale-110">
                <Zap className="h-8 w-8 text-primary group-hover:animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold">Instant Execution</h3>
              <p className="text-sm text-muted-foreground">
                Trade at lightning speed
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20 hover:border-primary/40 transition-all hover-scale group animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-all group-hover:scale-110">
                <Star className="h-8 w-8 text-primary group-hover:animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold">24/7 Support</h3>
              <p className="text-sm text-muted-foreground">
                Always here to help you
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">Everything you need to know about trading on Nadex</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="glass border border-primary/20 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:text-primary">
                Is Nadex platform secure?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, absolutely. We use bank-level 256-bit SSL encryption, two-factor authentication, and cold storage 
                for the majority of digital assets. Your funds are insured and protected at all times.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="glass border border-primary/20 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:text-primary">
                How do I start trading?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Simply sign up for a free account, complete the quick verification process, deposit funds using your 
                preferred payment method, and start trading. The entire process takes less than 5 minutes.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="glass border border-primary/20 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:text-primary">
                What are the trading fees?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We offer competitive trading fees starting from 0.1% per transaction. There are no hidden charges, 
                and you only pay when you trade. Deposits and withdrawals have minimal fees.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="glass border border-primary/20 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:text-primary">
                How long do withdrawals take?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Crypto withdrawals are typically processed within 15-30 minutes. Bank transfers may take 1-3 business 
                days depending on your bank and location.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="glass border border-primary/20 rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:text-primary">
                Do you provide customer support?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! Our dedicated support team is available 24/7 via live chat, email, and phone. We're here to help 
                you with any questions or issues you may encounter.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-4">What Our Users Say</h2>
          <p className="text-lg text-muted-foreground">
            Real feedback from real traders
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <Card className="glass border-primary/20 hover:border-primary/40 transition-all hover-scale animate-fade-in">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary hover:scale-125 transition-transform" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <p className="text-muted-foreground">
                "Nadex has completely transformed my trading experience. The platform is intuitive, 
                fast, and secure. Highly recommended!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold">RK</span>
                </div>
                <div>
                  <p className="font-semibold">Rahul Kumar</p>
                  <p className="text-sm text-muted-foreground">Active Trader</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20 hover:border-primary/40 transition-all hover-scale animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary hover:scale-125 transition-transform" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <p className="text-muted-foreground">
                "Best crypto trading platform I've used. Real-time data, easy interface, 
                and excellent customer support. Five stars!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold">PS</span>
                </div>
                <div>
                  <p className="font-semibold">Priya Sharma</p>
                  <p className="text-sm text-muted-foreground">Professional Trader</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20 hover:border-primary/40 transition-all hover-scale animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary hover:scale-125 transition-transform" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
              <p className="text-muted-foreground">
                "As a beginner, I found Nadex very easy to use. The platform guides you through 
                everything. Great for starting your crypto journey!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary font-semibold">AS</span>
                </div>
                <div>
                  <p className="font-semibold">Amit Singh</p>
                  <p className="text-sm text-muted-foreground">New Trader</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <Card className="glass border-primary/20 bg-gradient-primary/5 hover:border-primary/40 transition-all animate-fade-in overflow-hidden relative">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 animate-pulse" />
          
          <CardContent className="p-8 md:p-12 text-center space-y-6 relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold gradient-text animate-fade-in">
              Ready to Start Trading?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Join Nadex today and experience the future of cryptocurrency trading. 
              Create your account in minutes and start trading instantly.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-primary text-lg px-8 hover-scale shadow-lg hover:shadow-xl transition-all animate-fade-in"
              style={{ animationDelay: '0.2s' }}
              onClick={() => handleAuthClick(false)}
            >
              Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img 
                  src="/lovable-uploads/b0ad78d4-aa9f-4535-a7ec-d2f52a914912.png" 
                  alt="Nadex" 
                  className="w-8 h-8"
                />
                <span className="text-xl font-bold gradient-text">Nadex</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your trusted platform for cryptocurrency trading with real-time data and secure transactions.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>+91 1800-123-4567</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span>support@nadex.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  <span>Live Chat 24/7</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  Licensed & Regulated Trading Platform
                </span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                © 2025 Nadex. All rights reserved. Trade responsibly.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
