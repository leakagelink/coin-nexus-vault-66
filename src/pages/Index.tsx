
import { Layout } from "@/components/layout/layout";
import { PortfolioSummary } from "@/components/dashboard/portfolio-summary";
import { MarketOverview } from "@/components/dashboard/market-overview";

const Index = () => {
  return (
    <Layout>
      <div className="space-y-8 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">
            Welcome to CryptoTrade
          </h1>
          <p className="text-muted-foreground">
            Your gateway to cryptocurrency trading
          </p>
        </div>
        
        <PortfolioSummary />
        <MarketOverview />
      </div>
    </Layout>
  );
};

export default Index;
