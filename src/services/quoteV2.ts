import type { QuoteDashboardDataBundle } from "../components/features/Attrition/dashboardState";
import {
  dispatchSessionExpiredEvent,
  isAuthenticationErrorStatus,
} from "./auth";
import { getStoredAuthToken } from "./freePolicyV2";

export type QuoteReportProfile =
  | "converted-quotes"
  | "pending-quote"
  | "lapsed-quote"
  | "total-quote";
export type QuoteBinaryFilterValue = "all" | "1" | "0";
export type QuoteReceivedSourceValue = "all" | "web" | "phone";

export interface QuoteFilterOption {
  label: string;
  value: string;
}

export interface QuoteFiltersPayload {
  brands: QuoteFilterOption[];
  countries: QuoteFilterOption[];
  petTypes: QuoteFilterOption[];
}

export interface QuoteDashboardPayload {
  data: QuoteDashboardDataBundle;
  meta: Record<string, unknown>;
}

export interface QuoteReportColumnsPayload {
  columns: QuoteFilterOption[];
  meta: Record<string, unknown>;
  report: Record<string, unknown>;
}

export interface QuoteReportSummaryItem {
  count: number;
  description: string;
  label: string;
  profile: QuoteReportProfile;
}

export interface QuoteReportProfilesPayload {
  meta: Record<string, unknown>;
  profiles: QuoteReportSummaryItem[];
  report: Record<string, unknown>;
  total_rows: number;
}

export interface QuoteReportDataPayload {
  columns: Array<Record<string, unknown>>;
  limit: number;
  meta: Record<string, unknown>;
  rows: Array<Record<string, string | number | null>>;
  skip: number;
  total: number;
}

interface RawQuoteFilterOption {
  label: string;
  value: string;
}

interface RawQuoteFiltersResponse {
  filters: {
    brands: RawQuoteFilterOption[];
    countries: RawQuoteFilterOption[];
    pet_types: RawQuoteFilterOption[];
  };
  meta: Record<string, unknown>;
}

interface RawQuoteDashboardResponse {
  data: QuoteDashboardDataBundle;
  meta: Record<string, unknown>;
}

interface FetchQuoteFiltersParams {
  brands?: string[];
  countryCodes?: string[];
  signal?: AbortSignal;
}

interface FetchQuoteReportFiltersParams {
  brands?: string[];
  countryCodes?: string[];
  endDate: string;
  profile: QuoteReportProfile;
  signal?: AbortSignal;
  startDate: string;
}

interface FetchQuoteDashboardParams {
  brands?: string[];
  countryCodes?: string[];
  endDate: string;
  performanceEndDate?: string;
  performanceStartDate?: string;
  petTypes?: string[];
  signal?: AbortSignal;
  startDate: string;
}

interface DownloadQuoteReportParams {
  brands: string[];
  countryCodes: string[];
  endDate: string;
  existingClient?: QuoteBinaryFilterValue;
  filename?: string;
  isFreeProduct?: QuoteBinaryFilterValue;
  petTypes: string[];
  profile: QuoteReportProfile;
  quoteStatuses?: string[];
  receivedSource?: QuoteReceivedSourceValue;
  selectedColumns?: string[];
  sendDocumentOnEmail?: QuoteBinaryFilterValue;
  startDate: string;
}

interface DownloadQuoteProductPerformanceParams {
  brands: string[];
  countryCodes: string[];
  endDate: string;
  filename?: string;
  petTypes: string[];
  startDate: string;
}

interface DownloadQuoteCountryParams {
  brands: string[];
  countryCodes: string[];
  endDate: string;
  filename?: string;
  petTypes: string[];
  startDate: string;
}

type DownloadQuoteWorkflowParams = DownloadQuoteCountryParams;


interface DownloadQuotePromoPerformanceParams {
  brands: string[];
  countryCodes: string[];
  endDate: string;
  filename?: string;
  metricKey: "totalQuote" | "totalSales" | "conversionRate";
  petTypes: string[];
  startDate: string;
  view: "promoCode" | "agent";
}

interface FetchQuoteReportProfilesParams {
  asOfDate?: string;
  endDate: string;
  signal?: AbortSignal;
  startDate: string;
}

interface FetchQuoteReportColumnsParams {
  brands?: string[];
  endDate: string;
  petTypes?: string[];
  profile: QuoteReportProfile;
  signal?: AbortSignal;
  startDate: string;
}

interface FetchQuoteReportDataParams {
  brands?: string[];
  countryCodes?: string[];
  endDate: string;
  existingClient?: QuoteBinaryFilterValue;
  isFreeProduct?: QuoteBinaryFilterValue;
  limit?: number;
  petTypes?: string[];
  profile: QuoteReportProfile;
  quoteStatuses?: string[];
  receivedSource?: QuoteReceivedSourceValue;
  sendDocumentOnEmail?: QuoteBinaryFilterValue;
  signal?: AbortSignal;
  skip?: number;
  startDate: string;
}

const QUOTE_V2_DASHBOARD_BASE_URL =
  import.meta.env.VITE_API_V2_QUOTE_DASHBOARD_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:8000/api/v2/quote/dashboard";
const QUOTE_V2_REPORTS_BASE_URL =
  import.meta.env.VITE_API_V2_QUOTE_REPORTS_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:8000/api/v2/quote/reports";
const QUOTE_V2_FILTERS_BASE_URL =
  import.meta.env.VITE_API_V2_FILTERS_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:8000/api/v2/filters";

const dedupeOptions = (options: RawQuoteFilterOption[]) => {
  const seen = new Set<string>();
  const normalized: QuoteFilterOption[] = [];

  options.forEach((option) => {
    const value = String(option.value ?? "").trim();
    const label = String(option.label ?? value).trim();
    if (!value || !label) {
      return;
    }

    const key = value.toUpperCase();
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    normalized.push({ label, value });
  });

  return normalized;
};

const buildCommaSeparatedValue = (values: string[]) =>
  values.length ? values.join(",") : "all";

const buildSelectedColumnsValue = (values?: string[]) => {
  if (values === undefined) {
    return undefined;
  }

  return values.length ? values.join(",") : "__none__";
};

const buildUrl = (
  baseUrl: string,
  path: string,
  params?: Record<string, string | undefined>,
) => {
  const url = new URL(`${baseUrl}${path}`);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (!value) {
      return;
    }

    url.searchParams.set(key, value);
  });

  return url;
};

const extractErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as { detail?: string };
    return payload.detail || `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
};

const filenameFromContentDisposition = (
  header: string | null,
  fallback: string,
) => {
  if (!header) {
    return fallback;
  }

  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(header);
  try {
    return decodeURIComponent(match?.[1] ?? match?.[2] ?? "") || fallback;
  } catch {
    return fallback;
  }
};

const authenticatedFetch = async (url: URL, init?: RequestInit) => {
  const authToken = getStoredAuthToken();
  if (authToken) {
    url.searchParams.set("auth_token", authToken);
  }

  const response = await fetch(url.toString(), {
    ...init,
    cache: init?.cache ?? "no-store",
    headers: authToken
      ? {
          Authorization: `Bearer ${authToken}`,
          ...(init?.headers ?? {}),
        }
      : init?.headers,
  });

  if (!response.ok) {
    if (authToken && isAuthenticationErrorStatus(response.status)) {
      dispatchSessionExpiredEvent();
    }

    throw new Error(await extractErrorMessage(response));
  }

  return response;
};

export const fetchQuoteFilters = async ({
  brands = [],
  countryCodes = [],
  signal,
}: FetchQuoteFiltersParams = {}): Promise<QuoteFiltersPayload> => {
  const url = buildUrl(QUOTE_V2_FILTERS_BASE_URL, "/quote", {
    brands: buildCommaSeparatedValue(brands),
    country_codes: buildCommaSeparatedValue(countryCodes),
  });
  const response = await authenticatedFetch(url, {
    method: "GET",
    signal,
  });
  const payload = (await response.json()) as RawQuoteFiltersResponse;

  return {
    brands: dedupeOptions(payload.filters.brands),
    countries: dedupeOptions(payload.filters.countries),
    petTypes: dedupeOptions(payload.filters.pet_types),
  };
};

export const fetchQuoteReportFilters = async ({
  brands = [],
  countryCodes = [],
  endDate,
  profile,
  signal,
  startDate,
}: FetchQuoteReportFiltersParams): Promise<QuoteFiltersPayload> => {
  const url = buildUrl(QUOTE_V2_REPORTS_BASE_URL, "/filters", {
    brands: buildCommaSeparatedValue(brands),
    country_codes: buildCommaSeparatedValue(countryCodes),
    end_date: endDate,
    profile,
    start_date: startDate,
  });
  const response = await authenticatedFetch(url, {
    method: "GET",
    signal,
  });
  const payload = (await response.json()) as RawQuoteFiltersResponse;

  return {
    brands: dedupeOptions(payload.filters.brands),
    countries: dedupeOptions(payload.filters.countries),
    petTypes: dedupeOptions(payload.filters.pet_types),
  };
};

export const fetchQuoteDashboard = async ({
  brands = [],
  countryCodes = [],
  endDate,
  performanceEndDate,
  performanceStartDate,
  petTypes = [],
  signal,
  startDate,
}: FetchQuoteDashboardParams): Promise<QuoteDashboardPayload> => {
  const url = buildUrl(QUOTE_V2_DASHBOARD_BASE_URL, "", {
    brands: buildCommaSeparatedValue(brands),
    country_codes: buildCommaSeparatedValue(countryCodes),
    end_date: endDate,
    performance_end_date: performanceEndDate,
    performance_start_date: performanceStartDate,
    pet_types: buildCommaSeparatedValue(petTypes),
    start_date: startDate,
  });
  const response = await authenticatedFetch(url, {
    method: "GET",
    signal,
  });
  return (await response.json()) as RawQuoteDashboardResponse;
};

export const downloadQuoteCountry = async ({
  brands,
  countryCodes,
  endDate,
  filename,
  petTypes,
  startDate,
}: DownloadQuoteCountryParams) => {
  const url = buildUrl(QUOTE_V2_DASHBOARD_BASE_URL, "/country/download", {
    brands: buildCommaSeparatedValue(brands),
    country_codes: buildCommaSeparatedValue(countryCodes),
    end_date: endDate,
    filename,
    pet_types: buildCommaSeparatedValue(petTypes),
    start_date: startDate,
  });
  const response = await authenticatedFetch(url, {
    method: "GET",
  });
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const resolvedFilename = filenameFromContentDisposition(
    response.headers.get("content-disposition"),
    filename || `quote_by_country_${startDate}_to_${endDate}.xlsx`,
  );
  const anchor = document.createElement("a");

  anchor.href = downloadUrl;
  anchor.download = resolvedFilename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(downloadUrl);
};


export const downloadQuoteWorkflow = async ({
  brands,
  countryCodes,
  endDate,
  filename,
  petTypes,
  startDate,
}: DownloadQuoteWorkflowParams) => {
  const url = buildUrl(QUOTE_V2_DASHBOARD_BASE_URL, "/workflow/download", {
    brands: buildCommaSeparatedValue(brands),
    country_codes: buildCommaSeparatedValue(countryCodes),
    end_date: endDate,
    filename,
    pet_types: buildCommaSeparatedValue(petTypes),
    start_date: startDate,
  });
  const response = await authenticatedFetch(url, {
    method: "GET",
  });
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const resolvedFilename = filenameFromContentDisposition(
    response.headers.get("content-disposition"),
    filename || `quote_workflow_${startDate}_to_${endDate}.xlsx`,
  );
  const anchor = document.createElement("a");

  anchor.href = downloadUrl;
  anchor.download = resolvedFilename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

export const downloadQuoteProductPerformance = async ({
  brands,
  countryCodes,
  endDate,
  filename,
  petTypes,
  startDate,
}: DownloadQuoteProductPerformanceParams) => {
  const url = buildUrl(QUOTE_V2_DASHBOARD_BASE_URL, "/product-performance/download", {
    brands: buildCommaSeparatedValue(brands),
    country_codes: buildCommaSeparatedValue(countryCodes),
    download: "true",
    end_date: endDate,
    filename,
    pet_types: buildCommaSeparatedValue(petTypes),
    start_date: startDate,
  });
  const response = await authenticatedFetch(url, {
    method: "GET",
  });
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const resolvedFilename = filenameFromContentDisposition(
    response.headers.get("content-disposition"),
    filename || `quote_product_performance_source_${startDate}_to_${endDate}.csv`,
  );
  const anchor = document.createElement("a");

  anchor.href = downloadUrl;
  anchor.download = resolvedFilename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

export const downloadQuotePromoPerformance = async ({
  brands,
  countryCodes,
  endDate,
  filename,
  metricKey,
  petTypes,
  startDate,
  view,
}: DownloadQuotePromoPerformanceParams) => {
  const url = buildUrl(QUOTE_V2_DASHBOARD_BASE_URL, "/promo-performance/download", {
    brands: buildCommaSeparatedValue(brands),
    country_codes: buildCommaSeparatedValue(countryCodes),
    end_date: endDate,
    filename,
    metric_key: metricKey,
    pet_types: buildCommaSeparatedValue(petTypes),
    start_date: startDate,
    view,
  });
  const response = await authenticatedFetch(url, {
    method: "GET",
  });
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const resolvedFilename = filenameFromContentDisposition(
    response.headers.get("content-disposition"),
    filename ||
      `${view === "promoCode" ? "quote_by_promo_code" : "quote_by_agent"}_${startDate}_to_${endDate}.csv`,
  );
  const anchor = document.createElement("a");

  anchor.href = downloadUrl;
  anchor.download = resolvedFilename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

export const fetchQuoteReportProfiles = async ({  asOfDate,
  endDate,
  signal,
  startDate,
}: FetchQuoteReportProfilesParams): Promise<QuoteReportProfilesPayload> => {
  const url = buildUrl(QUOTE_V2_REPORTS_BASE_URL, "/profiles", {
    as_of_date: asOfDate,
    end_date: endDate,
    start_date: startDate,
  });
  const response = await authenticatedFetch(url, {
    method: "GET",
    signal,
  });
  return (await response.json()) as QuoteReportProfilesPayload;
};

export const fetchQuoteReportColumns = async ({
  brands = [],
  endDate,
  petTypes = [],
  profile,
  signal,
  startDate,
}: FetchQuoteReportColumnsParams): Promise<QuoteReportColumnsPayload> => {
  const url = buildUrl(QUOTE_V2_REPORTS_BASE_URL, "/columns", {
    brands: buildCommaSeparatedValue(brands),
    end_date: endDate,
    pet_types: buildCommaSeparatedValue(petTypes),
    profile,
    start_date: startDate,
  });
  const response = await authenticatedFetch(url, {
    method: "GET",
    signal,
  });
  const payload = (await response.json()) as QuoteReportColumnsPayload;

  return {
    ...payload,
    columns: dedupeOptions(payload.columns),
  };
};

export const fetchQuoteReportData = async ({
  brands = [],
  countryCodes = [],
  endDate,
  existingClient = "all",
  isFreeProduct = "all",
  limit,
  petTypes = [],
  profile,
  quoteStatuses = [],
  receivedSource = "all",
  sendDocumentOnEmail = "all",
  signal,
  skip,
  startDate,
}: FetchQuoteReportDataParams): Promise<QuoteReportDataPayload> => {
  const url = buildUrl(QUOTE_V2_REPORTS_BASE_URL, "/data", {
    brands: buildCommaSeparatedValue(brands),
    country_codes: buildCommaSeparatedValue(countryCodes),
    end_date: endDate,
    existing_client: existingClient,
    is_free_product: isFreeProduct,
    limit: limit ? String(limit) : undefined,
    pet_types: buildCommaSeparatedValue(petTypes),
    profile,
    quote_statuses: buildCommaSeparatedValue(quoteStatuses),
    received_sources: receivedSource,
    send_document_on_email: sendDocumentOnEmail,
    skip: skip ? String(skip) : undefined,
    start_date: startDate,
  });
  const response = await authenticatedFetch(url, {
    method: "GET",
    signal,
  });
  return (await response.json()) as QuoteReportDataPayload;
};

export const downloadQuoteReport = async ({
  brands,
  countryCodes,
  endDate,
  existingClient = "all",
  filename,
  isFreeProduct = "all",
  petTypes,
  profile,
  quoteStatuses = [],
  receivedSource = "all",
  selectedColumns,
  sendDocumentOnEmail = "all",
  startDate,
}: DownloadQuoteReportParams) => {
  const url = buildUrl(QUOTE_V2_REPORTS_BASE_URL, `/download/${profile}`, {
    brands: buildCommaSeparatedValue(brands),
    country_codes: buildCommaSeparatedValue(countryCodes),
    end_date: endDate,
    existing_client: existingClient,
    filename,
    is_free_product: isFreeProduct,
    pet_types: buildCommaSeparatedValue(petTypes),
    quote_statuses: buildCommaSeparatedValue(quoteStatuses),
    received_sources: receivedSource,
    selected_columns: buildSelectedColumnsValue(selectedColumns),
    send_document_on_email: sendDocumentOnEmail,
    start_date: startDate,
  });
  const response = await authenticatedFetch(url, {
    method: "GET",
  });
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const resolvedFilename = filenameFromContentDisposition(
    response.headers.get("content-disposition"),
    filename || `quote_${profile}_${startDate}_to_${endDate}.csv`,
  );
  const anchor = document.createElement("a");

  anchor.href = downloadUrl;
  anchor.download = resolvedFilename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

