import { useNavigate } from "react-router-dom";
import {
  brandFilterOptions,
  countryFilterOptions,
  currencyFilterOptions,
  metricFilterOptions,
  petTypeFilterOptions,
} from "../components/features/Attrition/dashboardState";
import type { PremiumCurrencyCode } from "../components/features/Attrition/data";
import type { TrendSeriesKey } from "../components/features/Attrition/QuotePerformance/types";
import Card from "../components/ui/card/Card";
import DashboardLayout from "../components/layout/DashboardLayout/DashboardLayout";
import DashboardProfileMenu from "../components/ui/dashboard_profile_menu/DashboardProfileMenu";
import V2EtlModal from "../components/ui/etl_modal/V2EtlModal";
import { dashboardMenuItems } from "../config/dashboardMenu";
import { useAuth } from "../context/AuthContext";
import { useV2EtlRunner } from "../features/etl/useV2EtlRunner";
import { getUserNameParts } from "../utils/auth";
import style from "./page_css/FeaturePlaceholderDashboard.module.css";

interface FeaturePlaceholderDashboardProps {
  description: string;
  focusAreas: string[];
  note: string;
  statusLabel?: string;
  title: string;
}

const FeaturePlaceholderDashboard: React.FC<
  FeaturePlaceholderDashboardProps
> = ({
  description,
  focusAreas,
  note,
  statusLabel = "Dashboard shell ready",
  title,
}) => {
  const navigate = useNavigate();
  const { canRunEtl, isAdmin, logout, user } = useAuth();
  const etlRunner = useV2EtlRunner();
  const { firstName, lastName } = getUserNameParts(user);

  return (
    <>
      <DashboardLayout
        headerProfile={
          <DashboardProfileMenu
            activeCurrencyCode={"GBP" as PremiumCurrencyCode}
            activeMetricKey={"totalQuote" as TrendSeriesKey}
            availableBrands={brandFilterOptions}
            availableCountries={countryFilterOptions}
            availableCurrencies={currencyFilterOptions}
            availableMetrics={metricFilterOptions}
            availablePetTypes={petTypeFilterOptions}
            firstName={firstName}
            isEtlRunning={etlRunner.isEtlRunning}
            lastName={lastName}
            onActiveCurrencyChange={() => undefined}
            onActiveMetricChange={() => undefined}
            onBrandsChange={() => undefined}
            onCountriesChange={() => undefined}
            onManageUsers={() => navigate("/manage_users")}
            onLogout={logout}
            onPetTypesChange={() => undefined}
            onRunEtl={etlRunner.openModal}
            selectedBrands={[]}
            selectedCountries={[]}
            selectedPetTypes={[]}
            showFilterControls={false}
            showManageUsersControl={isAdmin}
            showRunEtlControl={canRunEtl}
          />
        }
        menuItems={dashboardMenuItems}
        title={title}
      >
        <div className={style.root}>
          <Card className={style.hero}>
            <div className={style.statusBanner} role="status">
              {statusLabel}
            </div>
            <h2 className={style.heroTitle}>{title}</h2>
            <p className={style.heroCopy}>{description}</p>

            <div className={style.pills}>
              {focusAreas.map((area) => (
                <span className={style.pill} key={area}>
                  {area}
                </span>
              ))}
            </div>
          </Card>

          <div className={style.grid}>
            <Card className={style.panel}>
              <p className="cardTitle">What This View Should Surface</p>
              <ul className={style.list}>
                {focusAreas.map((area) => (
                  <li className={style.listItem} key={area}>
                    {area}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className={style.panel}>
              <p className="cardTitle">Implementation Note</p>
              <p className={style.note}>
                This route is live and shares the same shell, filters, and menu
                as the attrition dashboard. The visual blocks for this section
                can now be added without reworking navigation.
              </p>
              <p className={style.noteAccent}>{note}</p>
            </Card>
          </div>
        </div>
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

export default FeaturePlaceholderDashboard;
