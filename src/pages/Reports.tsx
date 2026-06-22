import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { DatePickerInput } from "@mantine/dates";
import { useMediaQuery } from "@mantine/hooks";
import { useNavigate } from "react-router-dom";
import type { IconType } from "react-icons";
import {
  RiAddLine,
  RiArrowLeftLine,
  RiDeleteBin6Line,
  RiDownloadCloud2Line,
  RiFileTextLine,
  RiLineChartLine,
  RiSave3Line,
  RiShieldCheckLine,
} from "react-icons/ri";
import Card from "../components/ui/card/Card";
import DashboardLayout, {
  type DashboardDateRange,
} from "../components/layout/DashboardLayout/DashboardLayout";
import DashboardProfileMenu from "../components/ui/dashboard_profile_menu/DashboardProfileMenu";
import { dashboardMenuItems } from "../config/dashboardMenu";
import {
  brandFilterOptions,
  countryFilterOptions,
  currencyFilterOptions,
  metricFilterOptions,
  petTypeFilterOptions,
  type SelectionOption,
} from "../components/features/Attrition/dashboardState";
import type { PremiumCurrencyCode } from "../components/features/Attrition/data";
import type { TrendSeriesKey } from "../components/features/Attrition/QuotePerformance/types";
import { getReportingPeriodPresets } from "../utils/reportingPeriodPresets";
import style from "./page_css/Reports.module.css";

type ReportId =
  | "debtors"
  | "free-policy"
  | "converted-quotes"
  | "converted-policy"
  | "active-policy"
  | "pending-quote"
  | "lapsed-quote"
  | "converted-quote";

type ReportScope = "Policy" | "Quote";
type OutputProfile = "operational" | "finance" | "executive";

interface ReportRow {
  [key: string]: string | number;
}

interface ReportBuildContext {
  brands: string[];
  countries: string[];
  dateRange: DashboardDateRange;
  petTypes: string[];
}

interface ReportDefinition {
  columns: string[];
  description: string;
  fileStem: string;
  id: ReportId;
  icon: IconType;
  label: string;
  scope: ReportScope;
  buildRows: (context: ReportBuildContext) => ReportRow[];
}

interface SavedReportSetup {
  id: string;
  includeHeaders: boolean;
  includeIdentifiers: boolean;
  isDefault: boolean;
  name: string;
  outputProfile: OutputProfile;
  reportId: ReportId;
  reportingPeriod: DashboardDateRange;
  savedAt: string;
  selectionModelVersion?: 2;
  selectedBrands: string[];
  selectedCountries: string[];
  selectedPetTypes: string[];
}

interface MultiSelectFieldProps<T extends string> {
  allLabel: string;
  description: string;
  onChange: (values: T[]) => void;
  options: SelectionOption<T>[];
  selectedValues: T[];
  title: string;
}

interface RadioOption<T extends string> {
  description: string;
  label: string;
  value: T;
}

const REPORT_SETUP_STORAGE_KEY = "quote-report-builder-setups";

const defaultDateRange: DashboardDateRange = [
  dayjs().startOf("month").format("YYYY-MM-DD"),
  dayjs().format("YYYY-MM-DD"),
];

const outputProfileOptions: RadioOption<OutputProfile>[] = [
  {
    description: "Full row-level extract for operational teams and follow-up.",
    label: "Operational Detail",
    value: "operational",
  },
  {
    description: "Premium, status, and market fields prioritised for finance users.",
    label: "Finance Review",
    value: "finance",
  },
  {
    description: "Condensed export for leadership and summary reporting.",
    label: "Executive Snapshot",
    value: "executive",
  },
];

const getAllOptionValues = <T extends string>(options: SelectionOption<T>[]) =>
  options.map((option) => option.value);

const allCountryValues = getAllOptionValues(countryFilterOptions);
const allBrandValues = getAllOptionValues(brandFilterOptions);
const allPetTypeValues = getAllOptionValues(petTypeFilterOptions);

const pickValues = (selected: string[], fallback: SelectionOption<string>[]) =>
  selected.length ? selected : fallback.map((option) => option.label).slice(0, 3);

const csvEscape = (value: string | number) => {
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
  }

  return stringValue;
};

const formatCurrencyAmount = (value: number) => `\u00A3${value.toLocaleString()}`;

const formatDateRangeLabel = ([start, end]: DashboardDateRange) => {
  if (!start && !end) {
    return "No reporting period selected";
  }

  if (start && end) {
    return `${dayjs(start).format("DD MMM YYYY")} - ${dayjs(end).format(
      "DD MMM YYYY",
    )}`;
  }

  return start
    ? `From ${dayjs(start).format("DD MMM YYYY")}`
    : `Until ${dayjs(end as string).format("DD MMM YYYY")}`;
};

const formatSelectionLabel = (
  selected: string[],
  allLabel: string,
  totalOptionCount: number,
) => {
  if (selected.length === totalOptionCount) {
    return allLabel;
  }

  if (!selected.length) {
    return "None selected";
  }

  if (selected.length <= 2) {
    return selected.join(", ");
  }

  return `${selected.length} selected`;
};

const formatSavedSetupDate = (value: string) =>
  dayjs(value).format("DD MMM YYYY • HH:mm");

const buildReportRows = (
  context: ReportBuildContext,
  columns: string[],
  rowFactory: (
    index: number,
    values: {
      brand: string;
      country: string;
      date: string;
      petType: string;
    },
  ) => ReportRow,
) => {
  const countries = pickValues(context.countries, countryFilterOptions);
  const brands = pickValues(context.brands, brandFilterOptions);
  const petTypes = pickValues(context.petTypes, petTypeFilterOptions);
  const [, endDate] = context.dateRange;
  const baseDate = endDate ? dayjs(endDate) : dayjs();
  const rowCount = Math.max(countries.length, brands.length, petTypes.length, 4);

  return Array.from({ length: rowCount }, (_, index) => {
    const row = rowFactory(index, {
      brand: brands[index % brands.length] ?? "All Brands",
      country: countries[index % countries.length] ?? "All Countries",
      date: baseDate.subtract(index * 2, "day").format("DD MMM YYYY"),
      petType: petTypes[index % petTypes.length] ?? "All Pet Types",
    });

    return columns.reduce<ReportRow>((accumulator, column) => {
      accumulator[column] = row[column] ?? "";
      return accumulator;
    }, {});
  });
};

const reportDefinitions: ReportDefinition[] = [
  {
    columns: [
      "Policy Number",
      "Country",
      "Brand",
      "Pet Type",
      "Effective Date",
      "Free Days",
      "Status",
    ],
    description:
      "Free-policy access and effective-date movement across the selected markets.",
    fileStem: "free_policy",
    icon: RiShieldCheckLine,
    id: "free-policy",
    label: "Free Policy",
    scope: "Policy",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Policy Number",
          "Country",
          "Brand",
          "Pet Type",
          "Effective Date",
          "Free Days",
          "Status",
        ],
        (index, values) => ({
          Brand: values.brand,
          Country: values.country,
          "Effective Date": values.date,
          "Free Days": 14 + index,
          "Pet Type": values.petType,
          "Policy Number": `FP-${1000 + index}`,
          Status: index % 2 === 0 ? "In Free Period" : "Converted",
        }),
      ),
  },
  {
    columns: [
      "Account Reference",
      "Policy Number",
      "Country",
      "Brand",
      "Pet Type",
      "Invoice Date",
      "Outstanding Amount",
      "Age Bucket",
      "Collection Status",
    ],
    description:
      "Outstanding debtor balances by market, brand, and aging bucket for finance follow-up.",
    fileStem: "debtors_report",
    icon: RiFileTextLine,
    id: "debtors",
    label: "Debtors",
    scope: "Policy",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Account Reference",
          "Policy Number",
          "Country",
          "Brand",
          "Pet Type",
          "Invoice Date",
          "Outstanding Amount",
          "Age Bucket",
          "Collection Status",
        ],
        (index, values) => ({
          "Account Reference": `DBT-${8400 + index}`,
          "Age Bucket":
            index % 4 === 0
              ? "0-30 Days"
              : index % 4 === 1
                ? "31-60 Days"
                : index % 4 === 2
                  ? "61-90 Days"
                  : "90+ Days",
          Brand: values.brand,
          "Collection Status":
            index % 3 === 0
              ? "Reminder sent"
              : index % 3 === 1
                ? "Payment plan"
                : "Escalated",
          Country: values.country,
          "Invoice Date": values.date,
          "Outstanding Amount": formatCurrencyAmount(95 + index * 37),
          "Pet Type": values.petType,
          "Policy Number": `DP-${5200 + index}`,
        }),
      ),
  },
  {
    columns: [
      "Quote Reference",
      "Country",
      "Brand",
      "Pet Type",
      "Converted Date",
      "Premium",
      "Channel",
    ],
    description:
      "Quoted business that converted, with premium movement across the chosen period.",
    fileStem: "converted_quotes",
    icon: RiLineChartLine,
    id: "converted-quotes",
    label: "Converted Quotes",
    scope: "Quote",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Quote Reference",
          "Country",
          "Brand",
          "Pet Type",
          "Converted Date",
          "Premium",
          "Channel",
        ],
        (index, values) => ({
          Brand: values.brand,
          Channel: index % 2 === 0 ? "Web" : "Contact Center",
          "Converted Date": values.date,
          Country: values.country,
          "Pet Type": values.petType,
          Premium: formatCurrencyAmount(245 + index * 18),
          "Quote Reference": `CQ-${2400 + index}`,
        }),
      ),
  },
  {
    columns: [
      "Policy Number",
      "Country",
      "Brand",
      "Pet Type",
      "Activation Date",
      "Policy Status",
      "Annual Premium",
    ],
    description:
      "Converted policies with status, activation date, and premium ready for export.",
    fileStem: "converted_policy",
    icon: RiShieldCheckLine,
    id: "converted-policy",
    label: "Converted Policy",
    scope: "Policy",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Policy Number",
          "Country",
          "Brand",
          "Pet Type",
          "Activation Date",
          "Policy Status",
          "Annual Premium",
        ],
        (index, values) => ({
          "Activation Date": values.date,
          "Annual Premium": formatCurrencyAmount(510 + index * 45),
          Brand: values.brand,
          Country: values.country,
          "Pet Type": values.petType,
          "Policy Number": `CP-${3200 + index}`,
          "Policy Status": "Active",
        }),
      ),
  },
  {
    columns: [
      "Policy Number",
      "Country",
      "Brand",
      "Pet Type",
      "Active Since",
      "Renewal Due",
      "Annual Premium",
    ],
    description:
      "Active policies by market, brand, and pet type, with renewal timing included.",
    fileStem: "active_policy",
    icon: RiShieldCheckLine,
    id: "active-policy",
    label: "Active Policy",
    scope: "Policy",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Policy Number",
          "Country",
          "Brand",
          "Pet Type",
          "Active Since",
          "Renewal Due",
          "Annual Premium",
        ],
        (index, values) => ({
          "Active Since": dayjs(values.date, "DD MMM YYYY")
            .subtract(4 + index, "month")
            .format("DD MMM YYYY"),
          "Annual Premium": formatCurrencyAmount(620 + index * 31),
          Brand: values.brand,
          Country: values.country,
          "Pet Type": values.petType,
          "Policy Number": `AP-${4100 + index}`,
          "Renewal Due": dayjs(values.date, "DD MMM YYYY")
            .add(11 - index, "month")
            .format("DD MMM YYYY"),
        }),
      ),
  },
  {
    columns: [
      "Quote Reference",
      "Country",
      "Brand",
      "Pet Type",
      "Created Date",
      "Age Days",
      "Stage",
    ],
    description:
      "Pending quote queue with age and current stage for the selected markets.",
    fileStem: "pending_quote",
    icon: RiLineChartLine,
    id: "pending-quote",
    label: "Pending Quote",
    scope: "Quote",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Quote Reference",
          "Country",
          "Brand",
          "Pet Type",
          "Created Date",
          "Age Days",
          "Stage",
        ],
        (index, values) => ({
          "Age Days": 3 + index * 2,
          Brand: values.brand,
          "Created Date": values.date,
          Country: values.country,
          "Pet Type": values.petType,
          "Quote Reference": `PQ-${5100 + index}`,
          Stage: index % 2 === 0 ? "Awaiting follow-up" : "Price review",
        }),
      ),
  },
  {
    columns: [
      "Quote Reference",
      "Country",
      "Brand",
      "Pet Type",
      "Lapsed Date",
      "Age Bucket",
      "Reason",
    ],
    description:
      "Lapsed quote export grouped by the selected filters for recovery follow-up.",
    fileStem: "lapsed_quote",
    icon: RiLineChartLine,
    id: "lapsed-quote",
    label: "Lapsed Quote",
    scope: "Quote",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Quote Reference",
          "Country",
          "Brand",
          "Pet Type",
          "Lapsed Date",
          "Age Bucket",
          "Reason",
        ],
        (index, values) => ({
          "Age Bucket":
            index % 3 === 0
              ? "0-30 Days"
              : index % 3 === 1
                ? "31-60 Days"
                : "61-90 Days",
          Brand: values.brand,
          Country: values.country,
          "Lapsed Date": values.date,
          "Pet Type": values.petType,
          "Quote Reference": `LQ-${6100 + index}`,
          Reason: index % 2 === 0 ? "No response" : "Price sensitivity",
        }),
      ),
  },
  {
    columns: [
      "Quote Reference",
      "Country",
      "Brand",
      "Pet Type",
      "Converted Date",
      "Converted By",
      "Sales Value",
    ],
    description:
      "Converted-quote detail focused on ownership and sales value for follow-up.",
    fileStem: "converted_quote_detail",
    icon: RiLineChartLine,
    id: "converted-quote",
    label: "Converted Quote",
    scope: "Quote",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Quote Reference",
          "Country",
          "Brand",
          "Pet Type",
          "Converted Date",
          "Converted By",
          "Sales Value",
        ],
        (index, values) => ({
          Brand: values.brand,
          Country: values.country,
          "Converted By":
            index % 2 === 0 ? "Contact Center Agent" : "Web Journey",
          "Converted Date": values.date,
          "Pet Type": values.petType,
          "Quote Reference": `CD-${7100 + index}`,
          "Sales Value": formatCurrencyAmount(210 + index * 24),
        }),
      ),
  },
];

const MultiSelectField = <T extends string>({
  allLabel,
  description,
  onChange,
  options,
  selectedValues,
  title,
}: MultiSelectFieldProps<T>) => {
  const allOptionValues = options.map((option) => option.value);
  const isAllSelected = selectedValues.length === options.length;

  const toggleValue = (value: T) => {
    if (isAllSelected) {
      onChange(allOptionValues.filter((entry) => entry !== value));
      return;
    }

    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((entry) => entry !== value));
      return;
    }

    onChange([...selectedValues, value]);
  };

  return (
    <section className={style.configSection}>
      <div className={style.configSectionHeader}>
        <div>
          <h3 className={style.configSectionTitle}>{title}</h3>
          <p className={style.configSectionCopy}>{description}</p>
        </div>

        <button
          className={`${style.ghostButton} ${
            isAllSelected ? style.ghostButtonActive : ""
          }`}
          onClick={() => onChange(isAllSelected ? [] : allOptionValues)}
          type="button"
        >
          <span
            className={`${style.allSelectionBox} ${
              isAllSelected ? style.allSelectionBoxActive : ""
            }`}
          >
            {isAllSelected ? "x" : ""}
          </span>
          {allLabel}
        </button>
      </div>

      <div className={style.checkboxGrid}>
        {options.map((option) => {
          const checked = selectedValues.includes(option.value);

          return (
            <label
              className={`${style.checkboxCard} ${
                checked ? style.checkboxCardActive : ""
              }`}
              key={option.value}
            >
              <input
                checked={checked}
                className={style.choiceInput}
                onChange={() => toggleValue(option.value)}
                type="checkbox"
              />
              <span className={style.checkboxIcon}>{checked ? "x" : ""}</span>
              <span className={style.choiceContent}>
                <span className={style.choiceLabel}>{option.label}</span>
                <span className={style.choiceMeta}>
                  {checked ? "Included" : "Not selected"}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
};

const deriveOutputColumns = (
  columns: string[],
  outputProfile: OutputProfile,
  includeIdentifiers: boolean,
) => {
  const identifierPattern = /policy number|quote reference/i;
  const executiveExcludedPattern = /reason|stage|converted by|channel|free days/i;
  const financePreferredPattern =
    /country|brand|pet type|premium|sales value|annual premium|status|converted date|effective date|activation date|renewal due|outstanding amount|invoice date|age bucket|collection status|account reference/i;

  let scopedColumns = columns;

  if (outputProfile === "executive") {
    scopedColumns = columns.filter(
      (column) =>
        !identifierPattern.test(column) && !executiveExcludedPattern.test(column),
    );
  }

  if (outputProfile === "finance") {
    scopedColumns = columns.filter((column) => financePreferredPattern.test(column));
  }

  if (!scopedColumns.length) {
    scopedColumns = columns.slice(0, Math.min(columns.length, 5));
  }

  if (!includeIdentifiers) {
    scopedColumns = scopedColumns.filter((column) => !identifierPattern.test(column));
  } else {
    const identifierColumns = columns.filter((column) =>
      identifierPattern.test(column),
    );
    scopedColumns = [
      ...identifierColumns,
      ...scopedColumns.filter((column) => !identifierPattern.test(column)),
    ];
  }

  return columns.filter((column) => scopedColumns.includes(column));
};

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 640px)") ?? false;
  const [activeReportId, setActiveReportId] = useState<ReportId | null>(null);
  const [reportingPeriod, setReportingPeriod] =
    useState<DashboardDateRange>(defaultDateRange);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([
    ...allCountryValues,
  ]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([
    ...allBrandValues,
  ]);
  const [selectedPetTypes, setSelectedPetTypes] = useState<string[]>([
    ...allPetTypeValues,
  ]);
  const [outputProfile, setOutputProfile] =
    useState<OutputProfile>("operational");
  const [includeIdentifiers, setIncludeIdentifiers] = useState(true);
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [savedSetups, setSavedSetups] = useState<SavedReportSetup[]>([]);
  const [activeSetupId, setActiveSetupId] = useState<string | null>(null);
  const [setupName, setSetupName] = useState("");
  const [builderFeedback, setBuilderFeedback] = useState<string | null>(null);

  const activeReport =
    reportDefinitions.find((report) => report.id === activeReportId) ?? null;
  const activeRows = useMemo(
    () =>
      activeReport &&
      selectedCountries.length > 0 &&
      selectedBrands.length > 0 &&
      selectedPetTypes.length > 0
        ? activeReport.buildRows({
            brands: selectedBrands,
            countries: selectedCountries,
            dateRange: reportingPeriod,
            petTypes: selectedPetTypes,
          })
        : [],
    [
      activeReport,
      reportingPeriod,
      selectedBrands,
      selectedCountries,
      selectedPetTypes,
    ],
  );
  const activeOutputColumns = useMemo(
    () =>
      activeReport
        ? deriveOutputColumns(
            activeReport.columns,
            outputProfile,
            includeIdentifiers,
          )
        : [],
    [activeReport, includeIdentifiers, outputProfile],
  );
  const savedSetupsForActiveReport = useMemo(
    () =>
      activeReport
        ? savedSetups
            .filter((setup) => setup.reportId === activeReport.id)
            .sort((left, right) => {
              if (left.isDefault !== right.isDefault) {
                return left.isDefault ? -1 : 1;
              }

              return dayjs(right.savedAt).valueOf() - dayjs(left.savedAt).valueOf();
            })
        : [],
    [activeReport, savedSetups],
  );
  const selectionSummary = [
    {
      id: "period",
      label: "Period",
      value: formatDateRangeLabel(reportingPeriod),
    },
    {
      id: "country",
      label: "Country",
      value: formatSelectionLabel(
        selectedCountries,
        "All markets",
        countryFilterOptions.length,
      ),
    },
    {
      id: "brand",
      label: "Brand",
      value: formatSelectionLabel(
        selectedBrands,
        "All brands",
        brandFilterOptions.length,
      ),
    },
    {
      id: "pet-type",
      label: "Pet Type",
      value: formatSelectionLabel(
        selectedPetTypes,
        "All pet types",
        petTypeFilterOptions.length,
      ),
    },
    {
      id: "profile",
      label: "Profile",
      value:
        outputProfileOptions.find((option) => option.value === outputProfile)?.label ??
        "Operational Detail",
    },
  ];

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(REPORT_SETUP_STORAGE_KEY);
      if (!storedValue) {
        return;
      }

      const parsedValue = JSON.parse(storedValue) as SavedReportSetup[];
      if (!Array.isArray(parsedValue)) {
        setSavedSetups([]);
        return;
      }

      setSavedSetups(
        parsedValue.map((setup) => ({
          ...setup,
          selectedBrands:
            setup.selectionModelVersion === 2
              ? setup.selectedBrands
              : setup.selectedBrands.length
                ? setup.selectedBrands
                : [...allBrandValues],
          selectedCountries:
            setup.selectionModelVersion === 2
              ? setup.selectedCountries
              : setup.selectedCountries.length
                ? setup.selectedCountries
                : [...allCountryValues],
          selectedPetTypes:
            setup.selectionModelVersion === 2
              ? setup.selectedPetTypes
              : setup.selectedPetTypes.length
                ? setup.selectedPetTypes
                : [...allPetTypeValues],
          selectionModelVersion: 2,
        })),
      );
    } catch {
      setSavedSetups([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      REPORT_SETUP_STORAGE_KEY,
      JSON.stringify(savedSetups),
    );
  }, [savedSetups]);

  const resetReportSetup = (reportId?: ReportId | null) => {
    setReportingPeriod(defaultDateRange);
    setSelectedCountries([...allCountryValues]);
    setSelectedBrands([...allBrandValues]);
    setSelectedPetTypes([...allPetTypeValues]);
    setOutputProfile("operational");
    setIncludeIdentifiers(true);
    setIncludeHeaders(true);
    setSaveAsDefault(false);
    setActiveSetupId(null);
    setBuilderFeedback(null);
    if (reportId) {
      const targetReport = reportDefinitions.find((report) => report.id === reportId);
      setSetupName(targetReport ? `${targetReport.label} Setup` : "");
      return;
    }

    setSetupName("");
  };

  const applySavedSetup = (setup: SavedReportSetup) => {
    setReportingPeriod(setup.reportingPeriod);
    setSelectedCountries(setup.selectedCountries);
    setSelectedBrands(setup.selectedBrands);
    setSelectedPetTypes(setup.selectedPetTypes);
    setOutputProfile(setup.outputProfile);
    setIncludeIdentifiers(setup.includeIdentifiers);
    setIncludeHeaders(setup.includeHeaders);
    setSaveAsDefault(setup.isDefault);
    setActiveSetupId(setup.id);
    setSetupName(setup.name);
  };

  const handleSelectReport = (reportId: ReportId) => {
    setActiveReportId(reportId);
    const defaultSetup =
      savedSetups.find((setup) => setup.reportId === reportId && setup.isDefault) ??
      null;

    if (defaultSetup) {
      applySavedSetup(defaultSetup);
      setBuilderFeedback(`Loaded default setup "${defaultSetup.name}".`);
      return;
    }

    resetReportSetup(reportId);
  };

  const handleBackToLibrary = () => {
    setActiveReportId(null);
    setBuilderFeedback(null);
  };

  const handleSaveSetup = () => {
    if (!activeReport) {
      return;
    }

    const resolvedName = setupName.trim() || `${activeReport.label} Setup`;
    const nextSetupId = activeSetupId ?? `setup-${Date.now()}`;
    const nextSetup: SavedReportSetup = {
      id: nextSetupId,
      includeHeaders,
      includeIdentifiers,
      isDefault: saveAsDefault,
      name: resolvedName,
      outputProfile,
      reportId: activeReport.id,
      reportingPeriod,
      savedAt: new Date().toISOString(),
      selectionModelVersion: 2,
      selectedBrands,
      selectedCountries,
      selectedPetTypes,
    };

    setSavedSetups((current) => {
      const withoutReportDefaults = saveAsDefault
        ? current.map((setup) =>
            setup.reportId === activeReport.id
              ? { ...setup, isDefault: setup.id === nextSetupId ? saveAsDefault : false }
              : setup,
          )
        : current;

      if (activeSetupId) {
        return withoutReportDefaults.map((setup) =>
          setup.id === activeSetupId ? nextSetup : setup,
        );
      }

      return [nextSetup, ...withoutReportDefaults];
    });

    setActiveSetupId(nextSetupId);
    setSetupName(resolvedName);
    setBuilderFeedback(
      activeSetupId ? `Updated setup "${resolvedName}".` : `Saved setup "${resolvedName}".`,
    );
  };

  const handleLoadSetup = (setupId: string) => {
    const targetSetup = savedSetups.find((setup) => setup.id === setupId);
    if (!targetSetup) {
      return;
    }

    setActiveReportId(targetSetup.reportId);
    applySavedSetup(targetSetup);
    setBuilderFeedback(`Loaded setup "${targetSetup.name}".`);
  };

  const handleDeleteSetup = (setupId: string) => {
    const targetSetup = savedSetups.find((setup) => setup.id === setupId);
    if (!targetSetup) {
      return;
    }

    const confirmed = window.confirm(`Delete saved setup "${targetSetup.name}"?`);
    if (!confirmed) {
      return;
    }

    setSavedSetups((current) => current.filter((setup) => setup.id !== setupId));

    if (activeSetupId === setupId) {
      setActiveSetupId(null);
      setSaveAsDefault(false);
      setBuilderFeedback(`Removed setup "${targetSetup.name}".`);
    }
  };

  const downloadReport = () => {
    if (!activeReport) {
      return;
    }

    const csvRows = activeRows.map((row) =>
      activeOutputColumns.map((column) => csvEscape(row[column] ?? "")).join(","),
    );
    const csv = [
      ...(includeHeaders ? [activeOutputColumns.map(csvEscape).join(",")] : []),
      ...csvRows,
    ].join("\n");
    const [start, end] = reportingPeriod;
    const fileName = `${activeReport.fileStem}_${start ?? "start"}_${end ?? "end"}.csv`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    setBuilderFeedback(`Downloaded ${activeReport.label}.`);
  };

  return (
    <DashboardLayout
      downloadAriaLabel={
        activeReport ? `Download ${activeReport.label}` : "Select a report first"
      }
      downloadDisabled={!activeReport}
      headerProfile={
        <DashboardProfileMenu
          activeCurrencyCode={"GBP" as PremiumCurrencyCode}
          activeMetricKey={"totalQuote" as TrendSeriesKey}
          availableBrands={brandFilterOptions}
          availableCountries={countryFilterOptions}
          availableCurrencies={currencyFilterOptions}
          availableMetrics={metricFilterOptions}
          availablePetTypes={petTypeFilterOptions}
          firstName="Chidi"
          lastName="Duru"
          onActiveCurrencyChange={() => undefined}
          onActiveMetricChange={() => undefined}
          onBrandsChange={() => undefined}
          onCountriesChange={() => undefined}
          onManageUsers={() => navigate("/manage_users")}
          onLogout={() => navigate("/")}
          onPetTypesChange={() => undefined}
          onRunEtl={() => undefined}
          selectedBrands={[]}
          selectedCountries={[]}
          selectedPetTypes={[]}
          showFilterControls={false}
          showRunEtlControl={false}
        />
      }
      menuItems={dashboardMenuItems}
      onDownload={downloadReport}
      showReportingPeriodControl={false}
      title="Reports"
    >
      <div className={style.root}>
        {activeReport ? (
          <div className={style.builderPage}>
            <div className={style.builderTopBar}>
              <button
                className={style.backButton}
                onClick={handleBackToLibrary}
                type="button"
              >
                <RiArrowLeftLine />
                Back to Report Library
              </button>

              <div className={style.topBarActions}>
                <button
                  className={style.secondaryAction}
                  onClick={() => resetReportSetup(activeReport.id)}
                  type="button"
                >
                  <RiAddLine />
                  New Setup
                </button>
                <button
                  className={style.primaryAction}
                  onClick={downloadReport}
                  type="button"
                >
                  <RiDownloadCloud2Line />
                  Download Report
                </button>
              </div>
            </div>

            <Card className={style.heroCard}>
              <div className={style.heroCardCopy}>
                <p className={style.eyebrow}>Report Setup</p>
                <h2 className={style.heroTitle}>{activeReport.label}</h2>
                <p className={style.heroCopy}>{activeReport.description}</p>
              </div>

              <div className={style.heroMeta}>
                <span className={style.heroBadge}>{activeReport.scope}</span>
                <span className={style.heroBadge}>
                  {savedSetupsForActiveReport.length} saved setups
                </span>
                <span className={style.heroBadge}>
                  {activeOutputColumns.length} output columns
                </span>
              </div>
            </Card>

            <div className={style.builderLayout}>
              <div className={style.builderMain}>
                <div className={style.configIntroRow}>
                  <Card className={style.configCard}>
                    <div className={style.cardHeader}>
                      <div>
                        <p className={style.eyebrow}>Setup</p>
                        <h3 className={style.cardTitle}>Saved Configuration</h3>
                      </div>
                      <p className={style.cardCopy}>
                        Save the current setup and reuse it whenever this report is
                        needed again.
                      </p>
                    </div>

                  <div className={style.inputGroup}>
                    <label className={style.inputLabel} htmlFor="report-setup-name">
                      Setup Name
                    </label>

                    <div className={style.setupRow}>
                      <input
                        className={`${style.textInput} ${style.setupInput}`}
                        id="report-setup-name"
                        onChange={(event) => setSetupName(event.target.value)}
                        placeholder={`${activeReport.label} Setup`}
                        type="text"
                        value={setupName}
                      />

                      <div className={style.setupActions}>
                        <button
                          className={style.secondaryActionStrong}
                          onClick={handleSaveSetup}
                          type="button"
                        >
                          <RiSave3Line />
                          {activeSetupId ? "Update Setup" : "Save Setup"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {builderFeedback ? (
                      <span className={style.feedbackText}>{builderFeedback}</span>
                    ) : null}
                  </Card>

                  <Card className={style.configCard}>
                    <div className={style.cardHeader}>
                      <div>
                        <p className={style.eyebrow}>Period</p>
                        <h3 className={style.cardTitle}>Reporting Window</h3>
                      </div>
                      <p className={style.cardCopy}>
                        Use the date picker to choose the exact reporting period for
                        this extract.
                      </p>
                    </div>

                    <div className={style.datePickerWrap}>
                      <DatePickerInput
                        aria-label="Select reporting period"
                        className={style.inlineDatePicker}
                        clearable
                        dropdownType={isMobile ? "modal" : "popover"}
                        onChange={setReportingPeriod}
                        placeholder="Select period"
                        presets={getReportingPeriodPresets()}
                        styles={{
                          input: {
                            backgroundColor: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid rgba(107, 99, 117, 0.18)",
                            borderRadius: "1rem",
                            color: "var(--text-h)",
                            fontSize: "0.92rem",
                            fontWeight: 600,
                            height: "3rem",
                          },
                          label: { display: "none" },
                        }}
                        type="range"
                        value={reportingPeriod}
                        valueFormat="DD MMM YYYY"
                      />
                    </div>
                  </Card>
                </div>

                <Card className={style.configCard}>
                  <div className={style.cardHeader}>
                    <div>
                      <p className={style.eyebrow}>Single Select</p>
                      <h3 className={style.cardTitle}>Output Profile</h3>
                    </div>
                    <p className={style.cardCopy}>
                      Choose the output profile that best matches how this report
                      will be consumed.
                    </p>
                  </div>

                  <div className={style.radioGrid}>
                    {outputProfileOptions.map((option) => {
                      const isChecked = outputProfile === option.value;

                      return (
                        <label
                          className={`${style.radioCard} ${
                            isChecked ? style.radioCardActive : ""
                          }`}
                          key={option.value}
                        >
                          <input
                            checked={isChecked}
                            className={style.choiceInput}
                            name="output-profile"
                            onChange={() => setOutputProfile(option.value)}
                            type="radio"
                          />
                          <span className={style.radioIcon} />
                          <span className={style.choiceContent}>
                            <span className={style.choiceLabel}>{option.label}</span>
                            <span className={style.choiceMeta}>
                              {option.description}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </Card>

                <Card className={style.configCard}>
                  <div className={style.cardHeader}>
                    <div>
                      <p className={style.eyebrow}>Multi Select</p>
                      <h3 className={style.cardTitle}>Scope Filters</h3>
                    </div>
                    <p className={style.cardCopy}>
                      Use checkboxes to narrow the report by market, brand, and pet
                      type.
                    </p>
                  </div>

                  <div className={style.multiSectionStack}>
                    <MultiSelectField
                      allLabel="All markets"
                      description="Include one or more countries in this extract."
                      onChange={setSelectedCountries}
                      options={countryFilterOptions}
                      selectedValues={selectedCountries}
                      title="Country"
                    />
                    <MultiSelectField
                      allLabel="All brands"
                      description="Limit the export to the brands that matter for this run."
                      onChange={setSelectedBrands}
                      options={brandFilterOptions}
                      selectedValues={selectedBrands}
                      title="Brand"
                    />
                    <MultiSelectField
                      allLabel="All pet types"
                      description="Control which pet types should appear in the result."
                      onChange={setSelectedPetTypes}
                      options={petTypeFilterOptions}
                      selectedValues={selectedPetTypes}
                      title="Pet Type"
                    />
                  </div>
                </Card>

                <Card className={style.configCard}>
                  <div className={style.cardHeader}>
                    <div>
                      <p className={style.eyebrow}>On / Off</p>
                      <h3 className={style.cardTitle}>Builder Options</h3>
                    </div>
                    <p className={style.cardCopy}>
                      Use toggles for export behaviour and saved setup defaults.
                    </p>
                  </div>

                  <div className={style.toggleStack}>
                    <label className={style.toggleRow}>
                      <div className={style.toggleCopy}>
                        <span className={style.toggleLabel}>Include identifiers</span>
                        <span className={style.toggleMeta}>
                          Keep policy numbers or quote references in the output.
                        </span>
                      </div>
                      <span className={style.toggleControl}>
                        <input
                          checked={includeIdentifiers}
                          className={style.toggleInput}
                          onChange={(event) =>
                            setIncludeIdentifiers(event.target.checked)
                          }
                          type="checkbox"
                        />
                        <span className={style.toggleTrack}>
                          <span className={style.toggleThumb} />
                        </span>
                      </span>
                    </label>

                    <label className={style.toggleRow}>
                      <div className={style.toggleCopy}>
                        <span className={style.toggleLabel}>Include headers</span>
                        <span className={style.toggleMeta}>
                          Add the column header row when the CSV is generated.
                        </span>
                      </div>
                      <span className={style.toggleControl}>
                        <input
                          checked={includeHeaders}
                          className={style.toggleInput}
                          onChange={(event) => setIncludeHeaders(event.target.checked)}
                          type="checkbox"
                        />
                        <span className={style.toggleTrack}>
                          <span className={style.toggleThumb} />
                        </span>
                      </span>
                    </label>

                    <label className={style.toggleRow}>
                      <div className={style.toggleCopy}>
                        <span className={style.toggleLabel}>Save as default</span>
                        <span className={style.toggleMeta}>
                          Automatically load this setup whenever the report is
                          opened.
                        </span>
                      </div>
                      <span className={style.toggleControl}>
                        <input
                          checked={saveAsDefault}
                          className={style.toggleInput}
                          onChange={(event) => setSaveAsDefault(event.target.checked)}
                          type="checkbox"
                        />
                        <span className={style.toggleTrack}>
                          <span className={style.toggleThumb} />
                        </span>
                      </span>
                    </label>
                  </div>
                </Card>
              </div>

              <aside className={style.builderSidebar}>
                <Card className={style.sidebarCard}>
                  <div className={style.sidebarHeader}>
                    <p className={style.eyebrow}>Summary</p>
                    <h3 className={style.sidebarTitle}>Current Report Setup</h3>
                  </div>

                  <div className={style.summaryList}>
                    {selectionSummary.map((item) => (
                      <div className={style.summaryRow} key={item.id}>
                        <span className={style.summaryRowLabel}>{item.label}</span>
                        <strong className={style.summaryRowValue}>
                          {item.value}
                        </strong>
                      </div>
                    ))}
                    <div className={style.summaryRow}>
                      <span className={style.summaryRowLabel}>Identifiers</span>
                      <strong className={style.summaryRowValue}>
                        {includeIdentifiers ? "Included" : "Removed"}
                      </strong>
                    </div>
                    <div className={style.summaryRow}>
                      <span className={style.summaryRowLabel}>Header Row</span>
                      <strong className={style.summaryRowValue}>
                        {includeHeaders ? "Included" : "Removed"}
                      </strong>
                    </div>
                  </div>
                </Card>

                <Card className={style.sidebarCard}>
                  <div className={style.sidebarHeader}>
                    <p className={style.eyebrow}>Saved Setups</p>
                    <h3 className={style.sidebarTitle}>Reusable Configurations</h3>
                  </div>

                  <div className={style.savedSetupList}>
                    {savedSetupsForActiveReport.length ? (
                      savedSetupsForActiveReport.map((setup) => (
                        <div className={style.savedSetupItem} key={setup.id}>
                          <div className={style.savedSetupCopy}>
                            <div className={style.savedSetupTitleRow}>
                              <strong className={style.savedSetupName}>
                                {setup.name}
                              </strong>
                              {setup.isDefault ? (
                                <span className={style.defaultBadge}>Default</span>
                              ) : null}
                            </div>
                            <span className={style.savedSetupMeta}>
                              {formatSavedSetupDate(setup.savedAt)}
                            </span>
                          </div>

                          <div className={style.savedSetupActions}>
                            <button
                              className={style.savedSetupButton}
                              onClick={() => handleLoadSetup(setup.id)}
                              type="button"
                            >
                              Load
                            </button>
                            <button
                              className={style.savedSetupButtonDanger}
                              onClick={() => handleDeleteSetup(setup.id)}
                              type="button"
                            >
                              <RiDeleteBin6Line />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={style.emptyState}>
                        No saved setup yet for this report.
                      </div>
                    )}
                  </div>
                </Card>

                <Card className={style.sidebarCard}>
                  <div className={style.sidebarHeader}>
                    <p className={style.eyebrow}>Columns</p>
                    <h3 className={style.sidebarTitle}>Export Preview</h3>
                  </div>

                  <div className={style.columnList}>
                    {activeOutputColumns.map((column) => (
                      <span className={style.columnChip} key={column}>
                        {column}
                      </span>
                    ))}
                  </div>
                </Card>
              </aside>
            </div>
          </div>
        ) : (
          <div className={style.libraryPage}>
            <div className={style.libraryHero}>
              <div className={style.libraryHeroCopy}>
                <p className={style.eyebrow}>Report Library</p>
                <h2 className={style.libraryTitle}>
                  Choose a report to start building
                </h2>
                <p className={style.libraryCopy}>
                  Open a report template, configure the period and filters, then
                  save the setup for repeat use.
                </p>
              </div>
            </div>

            <div className={style.reportGrid}>
              {reportDefinitions.map((report) => {
                const ReportIcon = report.icon || RiFileTextLine;

                return (
                  <button
                    className={style.reportCard}
                    key={report.id}
                    onClick={() => handleSelectReport(report.id)}
                    type="button"
                  >
                    <span className={style.reportCardIcon}>
                      <ReportIcon />
                    </span>

                    <div className={style.reportCardBody}>
                      <span
                        className={`${style.reportScopeBadge} ${
                          report.scope === "Policy"
                            ? style.reportScopePolicy
                            : style.reportScopeQuote
                        }`}
                      >
                        {report.scope}
                      </span>
                      <strong className={style.reportCardTitle}>{report.label}</strong>
                      <span className={style.reportCardDescription}>
                        {report.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Reports;
