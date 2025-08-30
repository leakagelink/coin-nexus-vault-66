
import { Layout } from "@/components/layout/layout";
import { PortfolioSummary } from "@/components/dashboard/portfolio-summary";
import { MarketOverview } from "@/components/dashboard/market-overview";
import { LiveMomentum } from "@/components/dashboard/live-momentum";

const Index = () => {
  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 animate-slide-up pb-20 md:pb-8 px-2 md:px-0">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          <div className="xl:col-span-2 order-2 xl:order-1">
            <PortfolioSummary />
          </div>
          <div className="xl:col-span-1 order-1 xl:order-2">
            <LiveMomentum />
          </div>
        </div>
        
        <div className="order-3">
          <MarketOverview />
        </div>
      </div>
    </Layout>
  );
};

export default Index;
