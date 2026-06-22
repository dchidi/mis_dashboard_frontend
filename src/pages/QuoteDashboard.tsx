import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PremiumOverview,
  ProductPerformance,
  QuoteByCountry,
  QuoteByPromoCode,
  QuoteWorkflow,
  QuoteTrend,
} from "../components/features/Attrition";
import {
  brandFilterOptions,
  buildQuoteDashboardData,
  countryFilterOptions,
  currencyFilterOptions,
  metricFilterOptions,
  petTypeFilterOptions,
} from "../components/features/Attrition/dashboardState";
import type { PremiumCurrencyCode } from "../components/features/Attrition/data";
import type { TrendSeriesKey } from "../components/features/Attrition/QuotePerformance/types";
import DashboardLayout from "../components/layout/DashboardLayout/DashboardLayout";
import DashboardProfileMenu from "../components/ui/dashboard_profile_menu/DashboardProfileMenu";
import { dashboardMenuItems } from "../config/dashboardMenu";
import style from "./page_css/QuoteDashboard.module.css";

interface DashboardChartViewProps {
  activeTrendSeriesKey: TrendSeriesKey;
  dashboardData: ReturnType<typeof buildQuoteDashboardData>;
  onTrendSeriesChange: (key: TrendSeriesKey) => void;
}

const renderChartView = ({
  activeTrendSeriesKey,
  dashboardData,
  onTrendSeriesChange,
}: DashboardChartViewProps) => (
  <div className={style.root}>
    <QuoteByCountry
      activeTrendSeriesKey={activeTrendSeriesKey}
      className={`${style.section} ${style.countryCard}`}
      data={dashboardData.quoteByCountryData}
    />
    <QuoteWorkflow
      className={`${style.section} ${style.workflowCard}`}
      data={dashboardData.quoteWorkflowData}
    />
    <PremiumOverview
      className={`${style.section} ${style.premiumCard}`}
      data={dashboardData.premiumOverviewData}
    />
    <QuoteTrend
      activeTrendSeriesKey={activeTrendSeriesKey}
      className={`${style.section} ${style.trendCard}`}
      data={dashboardData.quotePerformanceData}
      onTrendSeriesChange={onTrendSeriesChange}
    />
    <ProductPerformance
      activeTrendSeriesKey={activeTrendSeriesKey}
      className={`${style.section} ${style.productCard}`}
      data={dashboardData.productPerformanceData}
    />
    <QuoteByPromoCode
      activeTrendSeriesKey={activeTrendSeriesKey}
      className={`${style.section} ${style.promoCard}`}
      data={dashboardData.promoCodePerformanceData}
    />
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTrendSeriesKey, setActiveTrendSeriesKey] =
    useState<TrendSeriesKey>("totalQuote");
  const [activeCurrencyCode, setActiveCurrencyCode] =
    useState<PremiumCurrencyCode>("GBP");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPetTypes, setSelectedPetTypes] = useState<string[]>([]);
  const [isEtlRunning, setIsEtlRunning] = useState(false);
  const dashboardData = useMemo(
    () =>
      buildQuoteDashboardData({
        brands: selectedBrands,
        countries: selectedCountries,
        petTypes: selectedPetTypes,
      }),
    [selectedBrands, selectedCountries, selectedPetTypes],
  );

  useEffect(() => {
    if (!isEtlRunning) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsEtlRunning(false);
    }, 2400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isEtlRunning]);

  return (
    <DashboardLayout
      headerProfile={
        <DashboardProfileMenu
          activeCurrencyCode={activeCurrencyCode}
          activeMetricKey={activeTrendSeriesKey}
          availableBrands={brandFilterOptions}
          availableCountries={countryFilterOptions}
          availableCurrencies={currencyFilterOptions}
          availableMetrics={metricFilterOptions}
          availablePetTypes={petTypeFilterOptions}
          firstName="Chidi"
          isEtlRunning={isEtlRunning}
          lastName="Duru"
          onActiveCurrencyChange={setActiveCurrencyCode}
          onActiveMetricChange={setActiveTrendSeriesKey}
          onBrandsChange={setSelectedBrands}
          onCountriesChange={setSelectedCountries}
          onManageUsers={() => navigate("/manage_users")}
          onLogout={() => navigate("/")}
          onPetTypesChange={setSelectedPetTypes}
          onRunEtl={() => setIsEtlRunning(true)}
          selectedBrands={selectedBrands}
          selectedCountries={selectedCountries}
          selectedPetTypes={selectedPetTypes}
        />
      }
      menuItems={dashboardMenuItems}
      title="Quote Dashboard"
    >
      {renderChartView({
        activeTrendSeriesKey,
        dashboardData,
        onTrendSeriesChange: setActiveTrendSeriesKey,
      })}
    </DashboardLayout>
  );
};
export default Dashboard;
