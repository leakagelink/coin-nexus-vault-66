import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, TrendingUp, Shield, Zap, Users, Star, Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text animate-fade-in">
            Trade Cryptocurrency with Confidence
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Experience the future of crypto trading with real-time market data, 
            advanced analytics, and secure transactions on Nadex platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Button 
              size="lg" 
              className="bg-gradient-primary text-lg px-8"
              onClick={() => handleAuthClick(false)}
            >
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8"
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
          <Card className="glass border-primary/20 hover:border-primary/40 transition-all hover-scale">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Real-Time Trading</h3>
              <p className="text-muted-foreground">
                Access live market prices and execute trades instantly with our advanced trading platform
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20 hover:border-primary/40 transition-all hover-scale">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Secure & Safe</h3>
              <p className="text-muted-foreground">
                Your assets are protected with bank-level security and encrypted transactions
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20 hover:border-primary/40 transition-all hover-scale">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
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
          <Card className="glass border-primary/20">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">10,000+ Users</h3>
              <p className="text-sm text-muted-foreground">
                Growing community of active traders
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Bank-Level Security</h3>
              <p className="text-sm text-muted-foreground">
                Advanced encryption and protection
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Instant Execution</h3>
              <p className="text-sm text-muted-foreground">
                Trade at lightning speed
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Star className="h-8 w-8 text-primary" />
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
          <Card className="glass border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
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

          <Card className="glass border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
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

          <Card className="glass border-primary/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-primary text-primary" />
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
        <Card className="glass border-primary/20 bg-gradient-primary/5">
          <CardContent className="p-8 md:p-12 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold gradient-text">
              Ready to Start Trading?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join Nadex today and experience the future of cryptocurrency trading. 
              Create your account in minutes and start trading instantly.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-primary text-lg px-8"
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
