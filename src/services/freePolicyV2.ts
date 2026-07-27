export type FreePolicyOutputProfile =
  | "total-free-policies"
  | "active-converted"
  | "all-converted"
  | "active-not-converted"
  | "cancelled-not-converted"
  | "lapsed-not-converted";

import {
  dispatchSessionExpiredEvent,
  isAuthenticationErrorStatus,
} from "./auth";

export interface FreePolicyFilterOption {
  label: string;
  value: string;
}

export interface FreePolicyFiltersPayload {
  brands: FreePolicyFilterOption[];
  countries: FreePolicyFilterOption[];
  petTypes: FreePolicyFilterOption[];
}

interface RawFreePolicyFilterOption {
  label: string;
  value: string;
}

interface RawFreePolicyFiltersResponse {
  filters: {
    brands: RawFreePolicyFilterOption[];
    countries: RawFreePolicyFilterOption[];
    pet_types: RawFreePolicyFilterOption[];
  };
  meta: Record<string, unknown>;
}

interface FetchFreePolicyFiltersParams {
  brands?: string[];
  countryCodes?: string[];
  endDate: string;
  profile: FreePolicyOutputProfile;
  signal?: AbortSignal;
  startDate: string;
}

interface DownloadFreePolicyReportParams {
  brands: string[];
  countryCodes: string[];
  endDate: string;
  filename?: string;
  petTypes: string[];
  profile: FreePolicyOutputProfile;
  startDate: string;
}

const FREE_POLICY_V2_REPORTS_BASE_URL =
  import.meta.env.VITE_API_V2_FREE_POLICY_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:8000/api/v2/free-policy";

const parseTokenFromLocation = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("auth_token");
  } catch {
    return null;
  }
};

export const getStoredAuthToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem("authToken") || parseTokenFromLocation();
  } catch {
    return parseTokenFromLocation();
  }
};

const dedupeOptions = (options: RawFreePolicyFilterOption[]) => {
  const seen = new Set<string>();
  const normalized: FreePolicyFilterOption[] = [];

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

const authenticatedFetch = async (url: URL, init?: RequestInit) => {
  const authToken = getStoredAuthToken();

  if (authToken) {
    url.searchParams.set("auth_token", authToken);
  }

  const response = await fetch(url.toString(), {
    ...init,
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

export const fetchFreePolicyFilters = async ({
  brands = [],
  countryCodes = [],
  endDate,
  profile,
  signal,
  startDate,
}: FetchFreePolicyFiltersParams): Promise<FreePolicyFiltersPayload> => {
  const url = buildUrl(FREE_POLICY_V2_REPORTS_BASE_URL, "/reports/filters", {
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
  const payload = (await response.json()) as RawFreePolicyFiltersResponse;

  return {
    brands: dedupeOptions(payload.filters.brands),
    countries: dedupeOptions(payload.filters.countries),
    petTypes: dedupeOptions(payload.filters.pet_types),
  };
};

export const downloadFreePolicyReport = async ({
  brands,
  countryCodes,
  endDate,
  filename,
  petTypes,
  profile,
  startDate,
}: DownloadFreePolicyReportParams) => {
  const url = buildUrl(FREE_POLICY_V2_REPORTS_BASE_URL, `/reports/download/${profile}`, {
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
    filename || `free_policy_${profile}_${startDate}_to_${endDate}.csv`,
  );
  const anchor = document.createElement("a");

  anchor.href = downloadUrl;
  anchor.download = resolvedFilename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(downloadUrl);
};
