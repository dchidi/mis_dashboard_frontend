import { useMemo, useState } from "react";
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
import V2EtlModal from "../components/ui/etl_modal/V2EtlModal";
import { dashboardMenuItems } from "../config/dashboardMenu";
import { useAuth } from "../context/AuthContext";
import { useV2EtlRunner } from "../features/etl/useV2EtlRunner";
import { getUserNameParts } from "../utils/auth";
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
  const { isAdmin, logout, user } = useAuth();
  const [activeTrendSeriesKey, setActiveTrendSeriesKey] =
    useState<TrendSeriesKey>("totalQuote");
  const [activeCurrencyCode, setActiveCurrencyCode] =
    useState<PremiumCurrencyCode>("GBP");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPetTypes, setSelectedPetTypes] = useState<string[]>([]);
  const etlRunner = useV2EtlRunner();
  const dashboardData = useMemo(
    () =>
      buildQuoteDashboardData({
        brands: selectedBrands,
        countries: selectedCountries,
        petTypes: selectedPetTypes,
      }),
    [selectedBrands, selectedCountries, selectedPetTypes],
  );
  const { firstName, lastName } = getUserNameParts(user);

  return (
    <>
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
            firstName={firstName}
            isEtlRunning={etlRunner.isEtlRunning}
            lastName={lastName}
            onActiveCurrencyChange={setActiveCurrencyCode}
            onActiveMetricChange={setActiveTrendSeriesKey}
            onBrandsChange={setSelectedBrands}
            onCountriesChange={setSelectedCountries}
            onManageUsers={() => navigate("/manage_users")}
            onLogout={logout}
            onPetTypesChange={setSelectedPetTypes}
            onRunEtl={etlRunner.openModal}
            selectedBrands={selectedBrands}
            selectedCountries={selectedCountries}
            selectedPetTypes={selectedPetTypes}
            showManageUsersControl={isAdmin}
            showRunEtlControl={isAdmin}
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

      <V2EtlModal
        activeRouteOption={etlRunner.activeRouteOption}
        completedAt={etlRunner.completedAt}
        dateRange={etlRunner.dateRange}
        etlEvents={etlRunner.etlEvents}
        etlHeadline={etlRunner.etlHeadline}
        etlJobs={etlRunner.etlJobs}
        isOpen={etlRunner.isEtlModalOpen}
        isRunning={etlRunner.isEtlRunning}
        isStatusLoading={etlRunner.isStatusLoading}
        onClose={etlRunner.closeModal}
        onDateRangeChange={etlRunner.setDateRange}
        onResetDateRange={etlRunner.resetDateRange}
        onResetState={etlRunner.resetEtlState}
        onRun={() => void etlRunner.runSelectedEtl()}
        onSelectRoute={etlRunner.setSelectedRouteKey}
        routeOptions={etlRunner.routeOptions}
        selectedRouteKey={etlRunner.selectedRouteKey}
        startedAt={etlRunner.startedAt}
        statusError={etlRunner.statusError}
        statusSummary={etlRunner.statusSummary}
      />
    </>
  );
};
export default Dashboard;
