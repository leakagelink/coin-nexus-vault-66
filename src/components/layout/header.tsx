
import { Button } from "@/components/ui/button";
import { Menu, Bell, User } from "lucide-react";
import { Navigation } from "@/components/ui/navigation";

const navItems = [
  { label: "Dashboard", path: "/" },
  { label: "Watchlist", path: "/watchlist" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Wallet", path: "/wallet" },
  { label: "My Account", path: "/account" },
];

export function Header() {
  return (
    <header className="glass border-b border-border/50 sticky top-0 z-50">
      <div className="container flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CT</span>
            </div>
            <h1 className="text-xl font-bold gradient-text">CryptoTrade</h1>
          </div>
          
          <div className="hidden md:block">
            <Navigation items={navItems} />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="hover:bg-primary/10">
            <Bell className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="hover:bg-primary/10">
            <User className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="md:hidden hover:bg-primary/10">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
