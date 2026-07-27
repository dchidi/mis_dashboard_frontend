import {
  authStorage,
  dispatchSessionExpiredEvent,
  isAuthenticationErrorStatus,
} from "./auth";

export interface ActivePolicyFilterOption {
  label: string;
  value: string;
}

export type PaidPolicyReportProfile =
  | "active-policy"
  | "converted-policy"
  | "cancelled-policy"
  | "pending-policy"
  | "expired-policy";

interface DownloadPaidPolicyReportParams {
  brands: string[];
  countryCodes: string[];
  endDate?: string;
  petTypes: string[];
  profile: PaidPolicyReportProfile;
  startDate?: string;
}

export const activePolicyCountryOptions: ActivePolicyFilterOption[] = [
  { label: "United Kingdom", value: "UK" },
  { label: "Australia", value: "AU" },
  { label: "New Zealand", value: "NZ" },
  { label: "Germany", value: "DE" },
  { label: "Austria", value: "AT" },
];

export const activePolicyBrandOptions: ActivePolicyFilterOption[] = [
  { label: "BPIS", value: "BPIS" },
  { label: "PetCover", value: "PetCover" },
  { label: "CoverMy", value: "CoverMy" },
  { label: "BB Commercial", value: "BBCommercial" },
];

export const activePolicyPetTypeOptions: ActivePolicyFilterOption[] = [
  { label: "Cat", value: "Cat" },
  { label: "Dog", value: "Dog" },
  { label: "Horse", value: "Horse" },
  { label: "Exotic", value: "Exotic" },
  { label: "CoverMy Cat", value: "CoverMyCat" },
  { label: "CoverMy Dog", value: "CoverMyDog" },
  { label: "BB Commercial", value: "BBCommercial" },
];

const ACTIVE_POLICY_V2_BASE_URL =
  import.meta.env.VITE_API_V2_ACTIVE_POLICY_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:8000/api/v2/active-policy";

const allValuesSelected = (
  selectedValues: string[],
  options: ActivePolicyFilterOption[],
) => {
  if (selectedValues.length !== options.length) {
    return false;
  }

  const selectedValueSet = new Set(selectedValues);
  return options.every((option) => selectedValueSet.has(option.value));
};

const buildFilterValue = (
  selectedValues: string[],
  options: ActivePolicyFilterOption[],
) =>
  allValuesSelected(selectedValues, options)
    ? "all"
    : selectedValues.join(",");

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

export const downloadPaidPolicyReport = async ({
  brands,
  countryCodes,
  endDate,
  petTypes,
  profile,
  startDate,
}: DownloadPaidPolicyReportParams) => {
  const url = new URL(`${ACTIVE_POLICY_V2_BASE_URL}/reports/download`);
  url.searchParams.set("profile", profile);
  if (profile !== "active-policy") {
    if (!startDate || !endDate) {
      throw new Error("A reporting period is required for this report.");
    }
    url.searchParams.set("start_date", startDate);
    url.searchParams.set("end_date", endDate);
  }
  url.searchParams.set(
    "country_codes",
    buildFilterValue(countryCodes, activePolicyCountryOptions),
  );
  url.searchParams.set(
    "brands",
    buildFilterValue(brands, activePolicyBrandOptions),
  );
  url.searchParams.set(
    "pet_types",
    buildFilterValue(petTypes, activePolicyPetTypeOptions),
  );

  const authToken = authStorage.getToken();
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      method: "GET",
    });
  } catch {
    throw new Error("Unable to reach the backend for the paid policy export.");
  }

  if (!response.ok) {
    if (authToken && isAuthenticationErrorStatus(response.status)) {
      dispatchSessionExpiredEvent();
    }
    throw new Error(await extractErrorMessage(response));
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const fallbackFilename = `${profile.replace(/-/g, "_")}.xlsx`;
  const filename = filenameFromContentDisposition(
    response.headers.get("content-disposition"),
    fallbackFilename,
  );
  const anchor = document.createElement("a");

  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(downloadUrl);
};