import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaArrowRightFromBracket,
  FaDatabase,
  FaFilter,
  FaShieldHalved,
  FaUsers,
} from "react-icons/fa6";
import { useAuth } from "../../../context/AuthContext";
import type { PremiumCurrencyCode } from "../../features/Attrition/data";
import type { SelectionOption } from "../../features/Attrition/dashboardState";
import type { TrendSeriesKey } from "../../features/Attrition/QuotePerformance/types";
import style from "./DashboardProfileMenu.module.css";

interface DashboardProfileMenuProps {
  activeCurrencyCode: PremiumCurrencyCode;
  activeMetricKey: TrendSeriesKey;
  availableBrands: SelectionOption<string>[];
  availableCountries: SelectionOption<string>[];
  availableCurrencies: SelectionOption<PremiumCurrencyCode>[];
  availableMetrics: SelectionOption<TrendSeriesKey>[];
  availablePetTypes: SelectionOption<string>[];
  firstName: string;
  isEtlRunning?: boolean;
  lastName: string;
  onActiveCurrencyChange: (value: PremiumCurrencyCode) => void;
  onActiveMetricChange: (value: TrendSeriesKey) => void;
  onBrandsChange: (values: string[]) => void;
  onCountriesChange: (values: string[]) => void;
  onManageUsers?: () => void;
  onLogout: () => void;
  onPetTypesChange: (values: string[]) => void;
  onRunEtl: () => void;
  selectedBrands: string[];
  selectedCountries: string[];
  selectedPetTypes: string[];
  showFilterControls?: boolean;
  showManageUsersControl?: boolean;
  showRunEtlControl?: boolean;
  userManagementActive?: boolean;
}

interface FilterGroupProps<T extends string> {
  allLabel: string;
  multi?: boolean;
  onChange: (values: T[]) => void;
  options: SelectionOption<T>[];
  selectedValues: T[];
  title: string;
}

const buildInitials = (firstName: string, lastName: string) =>
  `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();

const FilterGroup = <T extends string>({
  allLabel,
  multi = true,
  onChange,
  options,
  selectedValues,
  title,
}: FilterGroupProps<T>) => {
  const hasSelection = selectedValues.length > 0;

  const handleToggle = (value: T) => {
    if (!multi) {
      onChange([value]);
      return;
    }

    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((entry) => entry !== value));
      return;
    }

    onChange([...selectedValues, value]);
  };

  return (
    <section className={style.group}>
      <div className={style.groupTitleRow}>
        <span className={style.groupTitle}>{title}</span>
        {multi ? (
          <button
            className={`${style.optionButton} ${style.optionButtonSubtle} ${
              !hasSelection ? style.optionButtonActive : ""
            }`}
            onClick={() => onChange([])}
            type="button"
          >
            {allLabel}
          </button>
        ) : null}
      </div>

      <div className={style.optionGrid}>
        {options.map((option) => {
          const isActive = multi
            ? selectedValues.includes(option.value)
            : selectedValues[0] === option.value;

          return (
            <button
              className={`${style.optionButton} ${
                isActive ? style.optionButtonActive : ""
              }`}
              key={option.value}
              onClick={() => handleToggle(option.value)}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};

const DashboardProfileMenu: React.FC<DashboardProfileMenuProps> = ({
  activeCurrencyCode,
  activeMetricKey,
  availableBrands,
  availableCountries,
  availableCurrencies,
  availableMetrics,
  availablePetTypes,
  firstName,
  isEtlRunning = false,
  lastName,
  onActiveCurrencyChange,
  onActiveMetricChange,
  onBrandsChange,
  onCountriesChange,
  onManageUsers,
  onLogout,
  onPetTypesChange,
  onRunEtl,
  selectedBrands,
  selectedCountries,
  selectedPetTypes,
  showFilterControls = true,
  showManageUsersControl = true,
  showRunEtlControl = true,
  userManagementActive = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const initials = useMemo(
    () => buildInitials(firstName, lastName),
    [firstName, lastName],
  );
  const fullName = `${firstName} ${lastName}`.trim();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setShowFilters(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setShowFilters(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={style.root} ref={rootRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Open profile menu for ${fullName}`}
        className={style.trigger}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className={style.initials}>{initials}</span>
      </button>

      <div
        aria-hidden={!isOpen}
        className={`${style.menu} ${isOpen ? style.menuOpen : ""}`}
        role="menu"
      >
        <div className={style.menuHeader}>
          <span className={style.menuInitials}>{initials}</span>
          <div className={style.menuIdentity}>
            <strong className={style.menuName}>{fullName}</strong>
            <span className={style.menuMeta}>Dashboard Controls</span>
          </div>
        </div>

        <div className={style.actionList}>
          <button
            className={`${style.actionButton} ${
              showFilters ? style.actionButtonActive : ""
            }`}
            hidden={!showFilterControls}
            onClick={() => setShowFilters((current) => !current)}
            role="menuitem"
            type="button"
          >
            <FaFilter aria-hidden="true" />
            <span>Filters</span>
          </button>

          {showManageUsersControl ? (
            <button
              className={`${style.actionButton} ${
                userManagementActive ? style.actionButtonActive : ""
              }`}
              onClick={() => {
                setIsOpen(false);
                setShowFilters(false);
                onManageUsers?.();
              }}
              role="menuitem"
              type="button"
            >
              <FaUsers aria-hidden="true" />
              <span>Manage Users</span>
            </button>
          ) : null}

          {isAdmin ? (
            <button
              className={`${style.actionButton} ${
                location.pathname === "/role_menu_access"
                  ? style.actionButtonActive
                  : ""
              }`}
              onClick={() => {
                setIsOpen(false);
                setShowFilters(false);
                navigate("/role_menu_access");
              }}
              role="menuitem"
              type="button"
            >
              <FaShieldHalved aria-hidden="true" />
              <span>Role Menu Access</span>
            </button>
          ) : null}
          {showRunEtlControl ? (
            <button
              className={`${style.actionButton} ${
                isEtlRunning ? style.actionButtonActive : ""
              }`}
              disabled={isEtlRunning}
              onClick={onRunEtl}
              role="menuitem"
              type="button"
            >
              <FaDatabase aria-hidden="true" />
              <span>{isEtlRunning ? "Running ETL" : "Run ETL"}</span>
            </button>
          ) : null}

          <button
            className={style.actionButton}
            onClick={() => {
              setIsOpen(false);
              setShowFilters(false);
              onLogout();
            }}
            role="menuitem"
            type="button"
          >
            <FaArrowRightFromBracket aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>

        {showFilterControls && showFilters ? (
          <div className={style.filterPanel}>
            <FilterGroup
              allLabel="All"
              onChange={onCountriesChange}
              options={availableCountries}
              selectedValues={selectedCountries}
              title="Country"
            />

            <FilterGroup
              allLabel="All"
              onChange={onBrandsChange}
              options={availableBrands}
              selectedValues={selectedBrands}
              title="Brand"
            />

            <FilterGroup
              allLabel="All"
              onChange={onPetTypesChange}
              options={availablePetTypes}
              selectedValues={selectedPetTypes}
              title="Pet Type"
            />

            <FilterGroup
              allLabel="Current"
              multi={false}
              onChange={(values) =>
                onActiveCurrencyChange(values[0] ?? activeCurrencyCode)
              }
              options={availableCurrencies}
              selectedValues={[activeCurrencyCode]}
              title="Currency"
            />

            <FilterGroup
              allLabel="Current"
              multi={false}
              onChange={(values) =>
                onActiveMetricChange(values[0] ?? activeMetricKey)
              }
              options={availableMetrics}
              selectedValues={[activeMetricKey]}
              title="Metrics"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default DashboardProfileMenu;
