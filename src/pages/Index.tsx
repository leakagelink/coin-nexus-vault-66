
import { Layout } from "@/components/layout/layout";
import { PortfolioSummary } from "@/components/dashboard/portfolio-summary";
import { MarketOverview } from "@/components/dashboard/market-overview";
import { LiveMomentum } from "@/components/dashboard/live-momentum";

const Index = () => {
  return (
    <Layout>
      <div className="space-y-6 animate-slide-up pb-20 md:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PortfolioSummary />
          </div>
          <div className="lg:col-span-1">
            <LiveMomentum />
          </div>
        </div>
        
        <MarketOverview />
      </div>
    </Layout>
  );
};

export default Index;
