import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { MultiSelect } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useMediaQuery } from "@mantine/hooks";
import { useNavigate } from "react-router-dom";
import type { IconType } from "react-icons";
import {
  RiCloseLine,
  RiDownloadCloud2Line,
  RiFileTextLine,
  RiLineChartLine,
  RiShieldCheckLine,
} from "react-icons/ri";
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
  | "claims"
  | "free-policy"
  | "converted-quotes"
  | "converted-policy"
  | "active-policy"
  | "cancelled-policy"
  | "expired-policy"
  | "pending-policy"
  | "refer-policy"
  | "pending-quote"
  | "lapsed-quote"
  | "converted-quote";

type ReportScope = "Policy" | "Quote" | "Account" | "Claims";
type FreePolicyOutputProfile =
  | "active-converted"
  | "active-not-converted"
  | "lapsed-converted"
  | "lapsed-not-converted";

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
  libraryDescription?: string;
  libraryLabel?: string;
  label: string;
  modalBadgeLabel?: string;
  modalTitle?: string;
  scope: ReportScope;
  buildRows: (context: ReportBuildContext) => ReportRow[];
}

interface ReportFilterModalState {
  badgeLabel: string;
  description: string;
  profile: FreePolicyOutputProfile | null;
  reportId: ReportId;
  title: string;
}

interface FreePolicyProfileOption {
  description: string;
  label: string;
  value: FreePolicyOutputProfile;
}

interface QuoteReportOption {
  description: string;
  label: string;
  reportId: ReportId;
}

interface PolicyReportOption {
  description: string;
  label: string;
  reportId: ReportId;
}

const defaultDateRange: DashboardDateRange = [
  dayjs().startOf("month").format("YYYY-MM-DD"),
  dayjs().format("YYYY-MM-DD"),
];

const freePolicyProfileOptions: FreePolicyProfileOption[] = [
  {
    description: "Free-policy records that converted and are still active.",
    label: "Active Converted",
    value: "active-converted",
  },
  {
    description: "Policies still active but not yet converted out of free access.",
    label: "Active Not Converted",
    value: "active-not-converted",
  },
  {
    description: "Policies that lapsed after converting from the free-policy stage.",
    label: "Lapsed Converted",
    value: "lapsed-converted",
  },
  {
    description: "Policies that lapsed before converting out of free access.",
    label: "Lapsed Not Converted",
    value: "lapsed-not-converted",
  },
];

const freePolicyStatusByProfile: Record<FreePolicyOutputProfile, string> = {
  "active-converted": "Active Converted",
  "active-not-converted": "Active Not Converted",
  "lapsed-converted": "Lapsed Converted",
  "lapsed-not-converted": "Lapsed Not Converted",
};

const quoteReportOptions: QuoteReportOption[] = [
  {
    description:
      "Quoted business that converted, with premium movement across the chosen period.",
    label: "Converted Quotes",
    reportId: "converted-quotes",
  },
  {
    description:
      "Pending quote queue with age and current stage for the selected markets.",
    label: "Pending Quote",
    reportId: "pending-quote",
  },
  {
    description:
      "Lapsed quote export grouped by the selected filters for recovery follow-up.",
    label: "Lapsed Quote",
    reportId: "lapsed-quote",
  },
];

const policyReportOptions: PolicyReportOption[] = [
  {
    description:
      "Free-policy access and effective-date movement across the selected markets.",
    label: "Free Policy",
    reportId: "free-policy",
  },
  {
    description:
      "Converted policies with status, activation date, and premium ready for export.",
    label: "Converted Policy",
    reportId: "converted-policy",
  },
  {
    description:
      "Active policies by market, brand, and pet type, with renewal timing included.",
    label: "Active Policy",
    reportId: "active-policy",
  },
  {
    description:
      "Cancelled policy extract with cancellation date, reason, and premium movement.",
    label: "Cancelled Policy",
    reportId: "cancelled-policy",
  },
  {
    description:
      "Expired policies ready for review with expiry timing and annual premium values.",
    label: "Expired Policy",
    reportId: "expired-policy",
  },
  {
    description:
      "Pending policy queue with current stage, created date, and premium context.",
    label: "Pending Policy",
    reportId: "pending-policy",
  },
  {
    description:
      "Referred policies with referral reason, review status, and pricing context.",
    label: "Refer Policy",
    reportId: "refer-policy",
  },
];

const getScopeClassName = (scope: ReportScope) => {
  switch (scope) {
    case "Policy":
      return style.reportScopePolicy;
    case "Quote":
      return style.reportScopeQuote;
    case "Account":
      return style.reportScopeAccount;
    case "Claims":
      return style.reportScopeClaims;
    default:
      return style.reportScopeQuote;
  }
};

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
          Status:
            index % 4 === 0
              ? "Active Converted"
              : index % 4 === 1
                ? "Active Not Converted"
                : index % 4 === 2
                  ? "Lapsed Converted"
                  : "Lapsed Not Converted",
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
    libraryDescription:
      "Account-level debtor balances and collection status for finance follow-up.",
    libraryLabel: "Account Reports",
    label: "Debtors",
    modalBadgeLabel: "Result",
    modalTitle: "Debtors",
    scope: "Account",
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
      "Claim Number",
      "Country",
      "Brand",
      "Pet Type",
      "Claim Date",
      "Claim Status",
      "Claim Value",
    ],
    description:
      "Claim-level result extract with status, claim date, and value across selected markets.",
    fileStem: "claims_report",
    icon: RiFileTextLine,
    id: "claims",
    libraryLabel: "Claims Reports",
    label: "Claims",
    scope: "Claims",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Claim Number",
          "Country",
          "Brand",
          "Pet Type",
          "Claim Date",
          "Claim Status",
          "Claim Value",
        ],
        (index, values) => ({
          Brand: values.brand,
          "Claim Date": values.date,
          "Claim Number": `CL-${9200 + index}`,
          "Claim Status":
            index % 3 === 0
              ? "Open"
              : index % 3 === 1
                ? "In Review"
                : "Closed",
          "Claim Value": formatCurrencyAmount(180 + index * 54),
          Country: values.country,
          "Pet Type": values.petType,
        }),
      ),
  },
  {
    columns: [
      "Policy Number",
      "Country",
      "Brand",
      "Pet Type",
      "Cancellation Date",
      "Cancellation Reason",
      "Refund Value",
    ],
    description:
      "Cancelled policy extract with cancellation date, reason, and premium movement.",
    fileStem: "cancelled_policy",
    icon: RiShieldCheckLine,
    id: "cancelled-policy",
    label: "Cancelled Policy",
    scope: "Policy",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Policy Number",
          "Country",
          "Brand",
          "Pet Type",
          "Cancellation Date",
          "Cancellation Reason",
          "Refund Value",
        ],
        (index, values) => ({
          Brand: values.brand,
          "Cancellation Date": values.date,
          "Cancellation Reason":
            index % 3 === 0
              ? "Customer request"
              : index % 3 === 1
                ? "Non-payment"
                : "Coverage change",
          Country: values.country,
          "Pet Type": values.petType,
          "Policy Number": `XP-${4300 + index}`,
          "Refund Value": formatCurrencyAmount(110 + index * 28),
        }),
      ),
  },
  {
    columns: [
      "Policy Number",
      "Country",
      "Brand",
      "Pet Type",
      "Expiry Date",
      "Last Active Date",
      "Annual Premium",
    ],
    description:
      "Expired policies ready for review with expiry timing and annual premium values.",
    fileStem: "expired_policy",
    icon: RiShieldCheckLine,
    id: "expired-policy",
    label: "Expired Policy",
    scope: "Policy",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Policy Number",
          "Country",
          "Brand",
          "Pet Type",
          "Expiry Date",
          "Last Active Date",
          "Annual Premium",
        ],
        (index, values) => ({
          "Annual Premium": formatCurrencyAmount(470 + index * 34),
          Brand: values.brand,
          Country: values.country,
          "Expiry Date": values.date,
          "Last Active Date": dayjs(values.date, "DD MMM YYYY")
            .subtract(12 + index, "month")
            .format("DD MMM YYYY"),
          "Pet Type": values.petType,
          "Policy Number": `EP-${4500 + index}`,
        }),
      ),
  },
  {
    columns: [
      "Policy Number",
      "Country",
      "Brand",
      "Pet Type",
      "Created Date",
      "Pending Stage",
      "Quoted Premium",
    ],
    description:
      "Pending policy queue with current stage, created date, and premium context.",
    fileStem: "pending_policy",
    icon: RiShieldCheckLine,
    id: "pending-policy",
    label: "Pending Policy",
    scope: "Policy",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Policy Number",
          "Country",
          "Brand",
          "Pet Type",
          "Created Date",
          "Pending Stage",
          "Quoted Premium",
        ],
        (index, values) => ({
          Brand: values.brand,
          "Created Date": values.date,
          Country: values.country,
          "Pending Stage":
            index % 3 === 0
              ? "Awaiting documents"
              : index % 3 === 1
                ? "Payment review"
                : "Compliance check",
          "Pet Type": values.petType,
          "Policy Number": `PP-${4700 + index}`,
          "Quoted Premium": formatCurrencyAmount(390 + index * 22),
        }),
      ),
  },
  {
    columns: [
      "Policy Number",
      "Country",
      "Brand",
      "Pet Type",
      "Referral Date",
      "Referral Reason",
      "Review Status",
    ],
    description:
      "Referred policies with referral reason, review status, and pricing context.",
    fileStem: "refer_policy",
    icon: RiShieldCheckLine,
    id: "refer-policy",
    label: "Refer Policy",
    scope: "Policy",
    buildRows: (context) =>
      buildReportRows(
        context,
        [
          "Policy Number",
          "Country",
          "Brand",
          "Pet Type",
          "Referral Date",
          "Referral Reason",
          "Review Status",
        ],
        (index, values) => ({
          Brand: values.brand,
          Country: values.country,
          "Pet Type": values.petType,
          "Policy Number": `RP-${4900 + index}`,
          "Referral Date": values.date,
          "Referral Reason":
            index % 3 === 0
              ? "Breed rule"
              : index % 3 === 1
                ? "Claims history"
                : "Manual underwriting",
          "Review Status":
            index % 2 === 0 ? "In review" : "Awaiting decision",
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

interface SelectionPalette {
  activeOptionBackground: string;
  inputBorder: string;
  pillBackground: string;
  pillBorder: string;
  pillText: string;
  sectionColor: string;
}

const createSelectionInputStyles = (palette: SelectionPalette) =>
  ({
    dropdown: {
      backdropFilter: "blur(20px)",
      background:
        "linear-gradient(180deg, rgba(43, 46, 60, 0.98), rgba(35, 38, 51, 0.98))",
      border: "1px solid rgba(255, 255, 255, 0.08)",
    },
    input: {
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      border: `1px solid ${palette.inputBorder}`,
      borderRadius: "1rem",
      color: "var(--text-h)",
      fontSize: "0.92rem",
      fontWeight: 600,
      minHeight: "3.15rem",
    },
    label: {
      display: "none",
    },
    option: {
      borderRadius: 0,
      color: "var(--text-h)",
      fontSize: "0.88rem",
      minHeight: "2.25rem",
      "&[data-checked]": {
        backgroundColor: palette.activeOptionBackground,
        color: "#f6f2ff",
      },
    },
    pill: {
      "--pill-radius": "0.55rem",
      backgroundColor: palette.pillBackground,
      border: `1px solid ${palette.pillBorder}`,
      borderRadius: "0.55rem",
      color: palette.pillText,
      fontWeight: 700,
      minHeight: "1.55rem",
    },
    section: {
      color: palette.sectionColor,
    },
  }) as const;

const countrySelectionInputStyles = createSelectionInputStyles({
  activeOptionBackground: "rgba(104, 113, 176, 0.22)",
  inputBorder: "rgba(108, 117, 186, 0.22)",
  pillBackground: "rgba(102, 112, 176, 0.16)",
  pillBorder: "rgba(144, 155, 226, 0.24)",
  pillText: "#e8ebff",
  sectionColor: "rgba(190, 198, 255, 0.72)",
});

const brandSelectionInputStyles = createSelectionInputStyles({
  activeOptionBackground: "rgba(86, 150, 124, 0.22)",
  inputBorder: "rgba(95, 158, 132, 0.22)",
  pillBackground: "rgba(82, 146, 120, 0.16)",
  pillBorder: "rgba(121, 194, 164, 0.24)",
  pillText: "#e1f7ec",
  sectionColor: "rgba(178, 231, 204, 0.7)",
});

const petTypeSelectionInputStyles = createSelectionInputStyles({
  activeOptionBackground: "rgba(157, 116, 88, 0.22)",
  inputBorder: "rgba(167, 126, 97, 0.22)",
  pillBackground: "rgba(154, 114, 86, 0.16)",
  pillBorder: "rgba(208, 163, 126, 0.24)",
  pillText: "#ffeadb",
  sectionColor: "rgba(235, 199, 170, 0.72)",
});

const datePickerStyles = {
  dropdown: {
    backdropFilter: "blur(20px)",
    background:
      "linear-gradient(180deg, rgba(43, 46, 60, 0.98), rgba(35, 38, 51, 0.98))",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(107, 99, 117, 0.18)",
    borderRadius: "1rem",
    color: "var(--text-h)",
    fontSize: "0.92rem",
    fontWeight: 600,
    height: "3.15rem",
  },
  label: {
    display: "none",
  },
  section: {
    color: "var(--text)",
  },
} as const;

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 640px)") ?? false;
  const [isFreePolicyTypeModalOpen, setIsFreePolicyTypeModalOpen] =
    useState(false);
  const [isPolicyTypeModalOpen, setIsPolicyTypeModalOpen] = useState(false);
  const [isQuoteTypeModalOpen, setIsQuoteTypeModalOpen] = useState(false);
  const [activeFilterModal, setActiveFilterModal] =
    useState<ReportFilterModalState | null>(null);
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
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const activeReport = useMemo(
    () =>
      activeFilterModal
        ? reportDefinitions.find((report) => report.id === activeFilterModal.reportId) ??
          null
        : null,
    [activeFilterModal],
  );
  const standaloneLibraryReports = useMemo(
    () =>
      reportDefinitions.filter(
        (report) => report.id === "debtors" || report.id === "claims",
      ),
    [],
  );

  const canDownload = Boolean(
    activeReport &&
      reportingPeriod[0] &&
      reportingPeriod[1] &&
      selectedCountries.length &&
      selectedBrands.length &&
      selectedPetTypes.length,
  );

  const resetFilters = () => {
    setReportingPeriod(defaultDateRange);
    setSelectedCountries([...allCountryValues]);
    setSelectedBrands([...allBrandValues]);
    setSelectedPetTypes([...allPetTypeValues]);
    setFeedbackMessage(null);
  };

  const closeAllModals = () => {
    setIsFreePolicyTypeModalOpen(false);
    setIsPolicyTypeModalOpen(false);
    setIsQuoteTypeModalOpen(false);
    setActiveFilterModal(null);
    setFeedbackMessage(null);
  };

  useEffect(() => {
    if (
      !isFreePolicyTypeModalOpen &&
      !isPolicyTypeModalOpen &&
      !isQuoteTypeModalOpen &&
      !activeFilterModal
    ) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAllModals();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    activeFilterModal,
    isFreePolicyTypeModalOpen,
    isPolicyTypeModalOpen,
    isQuoteTypeModalOpen,
  ]);

  const handleReportCardClick = (report: ReportDefinition) => {
    resetFilters();
    if (report.id === "free-policy") {
      setIsFreePolicyTypeModalOpen(true);
      return;
    }

    setActiveFilterModal({
      badgeLabel: report.modalBadgeLabel ?? report.scope,
      description: report.description,
      profile: null,
      reportId: report.id,
      title: report.modalTitle ?? report.label,
    });
  };

  const handleQuoteLibraryClick = () => {
    resetFilters();
    setIsQuoteTypeModalOpen(true);
  };

  const handlePolicyLibraryClick = () => {
    resetFilters();
    setIsPolicyTypeModalOpen(true);
  };

  const handleFreePolicyTypeClick = (profile: FreePolicyOutputProfile) => {
    const option = freePolicyProfileOptions.find((entry) => entry.value === profile);
    if (!option) {
      return;
    }

    resetFilters();
    setIsFreePolicyTypeModalOpen(false);
    setActiveFilterModal({
      badgeLabel: "Policy",
      description: option.description,
      profile,
      reportId: "free-policy",
      title: option.label,
    });
  };

  const handleQuoteTypeClick = (reportId: ReportId) => {
    const option = quoteReportOptions.find((entry) => entry.reportId === reportId);
    if (!option) {
      return;
    }

    resetFilters();
    setIsQuoteTypeModalOpen(false);
    setActiveFilterModal({
      badgeLabel: "Quote",
      description: option.description,
      profile: null,
      reportId: option.reportId,
      title: option.label,
    });
  };

  const handlePolicyTypeClick = (reportId: ReportId) => {
    const option = policyReportOptions.find((entry) => entry.reportId === reportId);
    if (!option) {
      return;
    }

    resetFilters();
    setIsPolicyTypeModalOpen(false);

    if (option.reportId === "free-policy") {
      setIsFreePolicyTypeModalOpen(true);
      return;
    }

    setActiveFilterModal({
      badgeLabel: "Policy",
      description: option.description,
      profile: null,
      reportId: option.reportId,
      title: option.label,
    });
  };

  const handleDownload = () => {
    if (!activeReport || !activeFilterModal || !canDownload) {
      return;
    }

    const rows = activeReport.buildRows({
      brands: selectedBrands,
      countries: selectedCountries,
      dateRange: reportingPeriod,
      petTypes: selectedPetTypes,
    });
    const filteredRows =
      activeReport.id === "free-policy" && activeFilterModal.profile
        ? rows.filter(
            (row) =>
              row.Status ===
              freePolicyStatusByProfile[activeFilterModal.profile as FreePolicyOutputProfile],
          )
        : rows;
    const csvRows = filteredRows.map((row) =>
      activeReport.columns.map((column) => csvEscape(row[column] ?? "")).join(","),
    );
    const csv = [activeReport.columns.map(csvEscape).join(","), ...csvRows].join("\n");
    const [start, end] = reportingPeriod;
    const fileNameSuffix = activeFilterModal.profile
      ? `_${activeFilterModal.profile.replace(/-/g, "_")}`
      : "";
    const fileName = `${activeReport.fileStem}${fileNameSuffix}_${start ?? "start"}_${end ?? "end"}.csv`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    setFeedbackMessage(`Downloaded ${activeFilterModal.title}.`);
  };

  return (
    <DashboardLayout
      downloadAriaLabel="Download report"
      downloadDisabled
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
      showReportingPeriodControl={false}
      title="Reports"
    >
      <div className={style.root}>
        <div className={style.libraryPage}>
          <div className={style.libraryHero}>
            <div className={style.libraryHeroCopy}>
              <p className={style.eyebrow}>Report Library</p>
              <h2 className={style.libraryTitle}>Choose a report to download</h2>
              <p className={style.libraryCopy}>
                Select a report card, choose the filters you need, and download the
                extract directly.
              </p>
            </div>
          </div>

          <div className={style.reportGrid}>
            {standaloneLibraryReports.map((report) => {
              const ReportIcon = report.icon || RiFileTextLine;

              return (
                <button
                  className={style.reportCard}
                  key={report.id}
                  onClick={() => handleReportCardClick(report)}
                  type="button"
                >
                  <span className={style.reportCardIcon}>
                    <ReportIcon />
                  </span>

                  <div className={style.reportCardBody}>
                    <span
                      className={`${style.reportScopeBadge} ${getScopeClassName(
                        report.scope,
                      )}`}
                    >
                      {report.scope}
                    </span>
                    <strong className={style.reportCardTitle}>
                      {report.libraryLabel ?? report.label}
                    </strong>
                    <span className={style.reportCardDescription}>
                      {report.libraryDescription ?? report.description}
                    </span>
                  </div>
                </button>
              );
            })}

            <button
              className={style.reportCard}
              onClick={handlePolicyLibraryClick}
              type="button"
            >
              <span className={style.reportCardIcon}>
                <RiShieldCheckLine />
              </span>

              <div className={style.reportCardBody}>
                <span className={`${style.reportScopeBadge} ${style.reportScopePolicy}`}>
                  Policy
                </span>
                <strong className={style.reportCardTitle}>Policy Reports</strong>
                <span className={style.reportCardDescription}>
                  Free policy, converted policy, and active policy exports in one
                  grouped flow.
                </span>
              </div>
            </button>

            <button
              className={style.reportCard}
              onClick={handleQuoteLibraryClick}
              type="button"
            >
              <span className={style.reportCardIcon}>
                <RiLineChartLine />
              </span>

              <div className={style.reportCardBody}>
                <span className={`${style.reportScopeBadge} ${style.reportScopeQuote}`}>
                  Quote
                </span>
                <strong className={style.reportCardTitle}>Quote Reports</strong>
                <span className={style.reportCardDescription}>
                  Converted, pending, and lapsed quote exports in one grouped flow.
                </span>
              </div>
            </button>
          </div>
        </div>

        {isFreePolicyTypeModalOpen ? (
          <div className={style.modalOverlay} onClick={closeAllModals}>
            <div
              aria-labelledby="free-policy-type-modal-title"
              aria-modal="true"
              className={`${style.modal} ${style.selectionModal}`}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className={style.modalHeader}>
                <div className={style.modalHeaderCopy}>
                  <p className={style.modalEyebrow}>Free Policy</p>
                  <h3 className={style.modalTitle} id="free-policy-type-modal-title">
                    Choose policy type
                  </h3>
                  <p className={style.modalDescription}>
                    Select the exact free-policy extract you want before choosing
                    filters.
                  </p>
                </div>

                <button
                  aria-label="Close free policy type modal"
                  className={style.closeButton}
                  onClick={closeAllModals}
                  type="button"
                >
                  <RiCloseLine />
                </button>
              </div>

              <div className={style.policyTypeGrid}>
                {freePolicyProfileOptions.map((option) => (
                  <button
                    className={style.policyTypeCard}
                    key={option.value}
                    onClick={() => handleFreePolicyTypeClick(option.value)}
                    type="button"
                  >
                    <span className={style.policyTypeTag}>Free Policy</span>
                    <strong className={style.policyTypeCardTitle}>{option.label}</strong>
                    <span className={style.policyTypeCardDescription}>
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {isPolicyTypeModalOpen ? (
          <div className={style.modalOverlay} onClick={closeAllModals}>
            <div
              aria-labelledby="policy-type-modal-title"
              aria-modal="true"
              className={`${style.modal} ${style.selectionModal}`}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className={style.modalHeader}>
                <div className={style.modalHeaderCopy}>
                  <p className={style.modalEyebrow}>Policy Reports</p>
                  <h3 className={style.modalTitle} id="policy-type-modal-title">
                    Choose policy report
                  </h3>
                  <p className={style.modalDescription}>
                    Select the policy extract you want before choosing filters.
                  </p>
                </div>

                <button
                  aria-label="Close policy report type modal"
                  className={style.closeButton}
                  onClick={closeAllModals}
                  type="button"
                >
                  <RiCloseLine />
                </button>
              </div>

              <div className={style.policyTypeGrid}>
                {policyReportOptions.map((option) => (
                  <button
                    className={style.policyTypeCard}
                    key={option.reportId}
                    onClick={() => handlePolicyTypeClick(option.reportId)}
                    type="button"
                  >
                    <span className={style.policyTypeTag}>Policy</span>
                    <strong className={style.policyTypeCardTitle}>{option.label}</strong>
                    <span className={style.policyTypeCardDescription}>
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {isQuoteTypeModalOpen ? (
          <div className={style.modalOverlay} onClick={closeAllModals}>
            <div
              aria-labelledby="quote-type-modal-title"
              aria-modal="true"
              className={`${style.modal} ${style.selectionModal}`}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className={style.modalHeader}>
                <div className={style.modalHeaderCopy}>
                  <p className={style.modalEyebrow}>Quote Reports</p>
                  <h3 className={style.modalTitle} id="quote-type-modal-title">
                    Choose quote report
                  </h3>
                  <p className={style.modalDescription}>
                    Select the quote extract you want before choosing filters.
                  </p>
                </div>

                <button
                  aria-label="Close quote report type modal"
                  className={style.closeButton}
                  onClick={closeAllModals}
                  type="button"
                >
                  <RiCloseLine />
                </button>
              </div>

              <div className={style.policyTypeGrid}>
                {quoteReportOptions.map((option) => (
                  <button
                    className={style.policyTypeCard}
                    key={option.reportId}
                    onClick={() => handleQuoteTypeClick(option.reportId)}
                    type="button"
                  >
                    <span className={style.policyTypeTag}>Quote</span>
                    <strong className={style.policyTypeCardTitle}>{option.label}</strong>
                    <span className={style.policyTypeCardDescription}>
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {activeFilterModal && activeReport ? (
          <div className={style.modalOverlay} onClick={closeAllModals}>
            <div
              aria-labelledby="report-filter-modal-title"
              aria-modal="true"
              className={`${style.modal} ${style.filterModal}`}
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className={style.modalHeader}>
                <div className={style.modalHeaderCopy}>
                  <div className={style.modalBadgeRow}>
                    <span
                      className={`${style.reportScopeBadge} ${getScopeClassName(
                        activeReport.scope,
                      )}`}
                    >
                      {activeFilterModal.badgeLabel}
                    </span>
                    {activeFilterModal.profile ? (
                      <span className={style.modalSecondaryBadge}>
                        {activeReport.label}
                      </span>
                    ) : null}
                  </div>
                  <h3 className={style.modalTitle} id="report-filter-modal-title">
                    {activeFilterModal.title}
                  </h3>
                  <p className={style.modalDescription}>
                    {activeFilterModal.description}
                  </p>
                </div>

                <button
                  aria-label="Close report filter modal"
                  className={style.closeButton}
                  onClick={closeAllModals}
                  type="button"
                >
                  <RiCloseLine />
                </button>
              </div>

              <div className={style.formIntro}>
                <p className={style.formHint}>
                  All filter groups start selected by default. Refine only what you
                  need, then download the report.
                </p>
              </div>

              <div className={style.filterGrid}>
                <div className={`${style.fieldGroup} ${style.fieldGroupWide}`}>
                  <span className={style.fieldLabel}>Reporting Period</span>
                  <DatePickerInput
                    aria-label={`Select ${activeFilterModal.title} reporting period`}
                    clearable
                    dropdownType={isMobile ? "modal" : "popover"}
                    onChange={setReportingPeriod}
                    placeholder="Select period"
                    popoverProps={{ withinPortal: true, zIndex: 2600 }}
                    presets={getReportingPeriodPresets()}
                    styles={datePickerStyles}
                    type="range"
                    value={reportingPeriod}
                    valueFormat="DD MMM YYYY"
                  />
                </div>

                <div className={style.fieldGroup}>
                  <span className={style.fieldLabel}>Country</span>
                  <MultiSelect
                    aria-label="Select countries"
                    clearable
                    comboboxProps={{ shadow: "md", withinPortal: true, zIndex: 2600 }}
                    data={countryFilterOptions.map((option) => ({
                      label: option.label,
                      value: option.value,
                    }))}
                    nothingFoundMessage="No country found"
                    onChange={setSelectedCountries}
                    placeholder="Select countries"
                    searchable
                    styles={countrySelectionInputStyles}
                    value={selectedCountries}
                  />
                </div>

                <div className={style.fieldGroup}>
                  <span className={style.fieldLabel}>Brand</span>
                  <MultiSelect
                    aria-label="Select brands"
                    clearable
                    comboboxProps={{ shadow: "md", withinPortal: true, zIndex: 2600 }}
                    data={brandFilterOptions.map((option) => ({
                      label: option.label,
                      value: option.value,
                    }))}
                    nothingFoundMessage="No brand found"
                    onChange={setSelectedBrands}
                    placeholder="Select brands"
                    searchable
                    styles={brandSelectionInputStyles}
                    value={selectedBrands}
                  />
                </div>

                <div className={style.fieldGroup}>
                  <span className={style.fieldLabel}>Pet Type</span>
                  <MultiSelect
                    aria-label="Select pet types"
                    clearable
                    comboboxProps={{ shadow: "md", withinPortal: true, zIndex: 2600 }}
                    data={petTypeFilterOptions.map((option) => ({
                      label: option.label,
                      value: option.value,
                    }))}
                    nothingFoundMessage="No pet type found"
                    onChange={setSelectedPetTypes}
                    placeholder="Select pet types"
                    searchable
                    styles={petTypeSelectionInputStyles}
                    value={selectedPetTypes}
                  />
                </div>
              </div>

              {feedbackMessage ? (
                <span className={style.feedbackText}>{feedbackMessage}</span>
              ) : null}

              <div className={style.modalActions}>
                <button
                  className={style.secondaryAction}
                  onClick={closeAllModals}
                  type="button"
                >
                  Close
                </button>
                <button
                  className={style.primaryAction}
                  disabled={!canDownload}
                  onClick={handleDownload}
                  type="button"
                >
                  <RiDownloadCloud2Line />
                  Download Report
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
};

export default Reports;
