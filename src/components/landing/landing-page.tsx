import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, TrendingUp, Shield, Zap, Users, Star, Menu, X, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/b0ad78d4-aa9f-4535-a7ec-d2f52a914912.png" 
                alt="Nadex" 
                className="w-6 h-6"
              />
              <span className="font-semibold">Nadex</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2025 Nadex. All rights reserved. Trade responsibly.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
