import { useState } from "react";
import {
  MetricViewDropdown,
  PremiumOverview,
  ProductPerformance,
  QuoteByCountry,
  QuoteByPromoCode,
  QuoteWorkflow,
  QuoteTrend,
} from "../components/features/Attrition";
import type { TrendSeriesKey } from "../components/features/Attrition/QuotePerformance/types";
import DashboardLayout from "../components/layout/DashboardLayout/DashboardLayout";
import { dashboardMenuItems } from "../config/dashboardMenu";
import style from "./page_css/QuoteDashboard.module.css";

interface DashboardChartViewProps {
  activeTrendSeriesKey: TrendSeriesKey;
  onTrendSeriesChange: (key: TrendSeriesKey) => void;
}

const renderChartView = ({
  activeTrendSeriesKey,
  onTrendSeriesChange,
}: DashboardChartViewProps) => (
  <div className={style.root}>
    <div className={style.leftColumn}>
      <QuoteByCountry
        activeTrendSeriesKey={activeTrendSeriesKey}
        className={`${style.section} ${style.contentSection}`}
      />
      <QuoteWorkflow className={style.section} />
    </div>

    <PremiumOverview className={style.middleColumn} />

    <div className={style.rightColumn}>
      <QuoteTrend
        activeTrendSeriesKey={activeTrendSeriesKey}
        className={`${style.section} ${style.contentSection}`}
        onTrendSeriesChange={onTrendSeriesChange}
      />
      <ProductPerformance
        activeTrendSeriesKey={activeTrendSeriesKey}
        className={style.section}
      />
    </div>

    <div className={style.bottomRow}>
      <QuoteByPromoCode
        activeTrendSeriesKey={activeTrendSeriesKey}
        className={style.section}
      />
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [activeTrendSeriesKey, setActiveTrendSeriesKey] =
    useState<TrendSeriesKey>("totalQuote");

  return (
    <DashboardLayout
      headerLeading={
        <MetricViewDropdown
          activeKey={activeTrendSeriesKey}
          onChange={setActiveTrendSeriesKey}
        />
      }
      menuItems={dashboardMenuItems}
      title="Quote Dashboard"
    >
      {renderChartView({
        activeTrendSeriesKey,
        onTrendSeriesChange: setActiveTrendSeriesKey,
      })}
    </DashboardLayout>
  );
};
export default Dashboard;
