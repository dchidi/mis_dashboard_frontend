import { useEffect, useState } from "react";
import { Alert } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { RiAlertLine } from "react-icons/ri";
import Card from "../components/ui/card/Card";
import DashboardLayout from "../components/layout/DashboardLayout/DashboardLayout";
import DashboardProfileMenu from "../components/ui/dashboard_profile_menu/DashboardProfileMenu";
import V2EtlModal from "../components/ui/etl_modal/V2EtlModal";
import { dashboardMenuItems } from "../config/dashboardMenu";
import {
  brandFilterOptions,
  countryFilterOptions,
  currencyFilterOptions,
  metricFilterOptions,
  petTypeFilterOptions,
} from "../components/features/Attrition/dashboardState";
import type { PremiumCurrencyCode } from "../components/features/Attrition/data";
import type { TrendSeriesKey } from "../components/features/Attrition/QuotePerformance/types";
import { useAuth } from "../context/AuthContext";
import { useV2EtlRunner } from "../features/etl/useV2EtlRunner";
import {
  authService,
  type AuthMenuKey,
  type AuthUserRole,
} from "../services/auth";
import { getUserNameParts } from "../utils/auth";
import style from "./page_css/RoleMenuAccess.module.css";

const roleLabels: Record<AuthUserRole, string> = {
  mis: "MIS",
  admin: "Admin",
  super_admin: "SuperAdmin",
  marketing: "Marketing",
  biz_dev: "BizDev",
  exec_user: "ExecUser",
};

const allRoleOptions: AuthUserRole[] = [
  "mis",
  "admin",
  "super_admin",
  "marketing",
  "biz_dev",
  "exec_user",
];
const adminRoleOptions: AuthUserRole[] = [
  "mis",
  "marketing",
  "biz_dev",
  "exec_user",
];

const menuOptions: Array<{ key: AuthMenuKey; label: string }> = [
  { key: "quote", label: "Quote" },
  { key: "policy", label: "Policy" },
  { key: "renewals", label: "Renewals" },
  { key: "reports", label: "Reports" },
  { key: "dsr", label: "Daily Sales Report" },
];

const RoleMenuAccess: React.FC = () => {
  const navigate = useNavigate();
  const {
    canRunEtl,
    isAdmin,
    isSuperAdmin,
    logout,
    refreshMenuPermissions,
    user,
  } = useAuth();
  const etlRunner = useV2EtlRunner();
  const [permissions, setPermissions] = useState<
    Partial<Record<AuthUserRole, AuthMenuKey[]>>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingRole, setSavingRole] = useState<AuthUserRole | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { firstName, lastName } = getUserNameParts(user);
  const roleOptions = isSuperAdmin ? allRoleOptions : adminRoleOptions;

  useEffect(() => {
    let isActive = true;

    void authService
      .listRoleMenuPermissions()
      .then((rolePermissions) => {
        if (!isActive) {
          return;
        }
        setPermissions(
          Object.fromEntries(
            rolePermissions.map((entry) => [
              entry.role,
              entry.allowed_menus,
            ]),
          ) as Partial<Record<AuthUserRole, AuthMenuKey[]>>,
        );
      })
      .catch((requestError) => {
        if (isActive) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load role menu access.",
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const toggleMenu = (role: AuthUserRole, menuKey: AuthMenuKey) => {
    setPermissions((current) => {
      const currentMenus = current[role] ?? [];
      const nextMenus = currentMenus.includes(menuKey)
        ? currentMenus.filter((key) => key !== menuKey)
        : [...currentMenus, menuKey];
      return { ...current, [role]: nextMenus };
    });
  };

  const saveRole = async (role: AuthUserRole) => {
    setSavingRole(role);
    setError("");
    setNotice("");
    try {
      const updated = await authService.updateRoleMenuPermissions(
        role,
        permissions[role] ?? [],
      );
      setPermissions((current) => ({
        ...current,
        [role]: updated.allowed_menus,
      }));
      if (role === user?.role) {
        await refreshMenuPermissions();
      }
      setNotice(`${roleLabels[role]} menu access was updated.`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update role menu access.",
      );
    } finally {
      setSavingRole(null);
    }
  };

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
      showDownloadControl={false}
      showReportingPeriodControl={false}
      title="Role Menu Access"
    >
      <div className={style.root}>
        {error ? (
          <Alert color="red" icon={<RiAlertLine />} radius="lg" variant="light">
            {error}
          </Alert>
        ) : null}
        {notice ? (
          <div className={style.notice} role="status">
            {notice}
          </div>
        ) : null}

        <Card className={style.accessCard}>
          <div className={style.header}>
            <div>
              <p className={style.eyebrow}>Navigation Control</p>
              <h2 className={style.title}>Role Menu Access</h2>
              <p className={style.copy}>
                Choose which dashboard menus each role can open. Marketing
                defaults to Reports only. Settings are stored centrally and
                apply on every device after sign-in or refresh.
              </p>
            </div>
            <span className={style.statusText}>
              {isLoading ? "Loading access..." : "Admin access"}
            </span>
          </div>

          <div className={style.roleAccessList}>
            {roleOptions.map((role) => (
              <div className={style.roleAccessRow} key={role}>
                <div className={style.roleAccessName}>
                  <span
                    className={`${style.roleBadge} ${
                      role === "super_admin" ? style.superAdminBadge : ""
                    }`}
                  >
                    {roleLabels[role]}
                  </span>
                </div>
                <div className={style.menuToggleGroup}>
                  {menuOptions.map((menu) => (
                    <label className={style.menuToggle} key={menu.key}>
                      <input
                        checked={Boolean(
                          permissions[role]?.includes(menu.key),
                        )}
                        disabled={
                          isLoading || !permissions[role] || savingRole === role
                        }
                        onChange={() => toggleMenu(role, menu.key)}
                        type="checkbox"
                      />
                      <span>{menu.label}</span>
                    </label>
                  ))}
                </div>
                <button
                  className={style.saveButton}
                  disabled={
                    isLoading || !permissions[role] || savingRole === role
                  }
                  onClick={() => void saveRole(role)}
                  type="button"
                >
                  {savingRole === role ? "Saving..." : "Save"}
                </button>
              </div>
            ))}
          </div>
        </Card>
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

export default RoleMenuAccess;
