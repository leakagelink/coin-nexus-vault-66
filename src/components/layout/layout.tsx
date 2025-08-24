
import { Header } from "./header";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className={cn("container mx-auto px-6 py-8", className)}>
        {children}
      </main>
      <BottomNavigation />
    </div>
  );
}
