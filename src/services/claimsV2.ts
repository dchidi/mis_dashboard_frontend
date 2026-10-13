import { API_V2_BASE_URL } from "../config/api";
import {
  authStorage,
  dispatchSessionExpiredEvent,
  isAuthenticationErrorStatus,
} from "./auth";

export interface ClaimsFilterOption {
  label: string;
  value: string;
}

export type ClaimsReportProfile =
  | "claims-turnaround-time"
  | "claims-data";

interface DownloadClaimsReportParams {
  brands: string[];
  countryCodes: string[];
  endDate: string;
  petTypes: string[];
  profile: ClaimsReportProfile;
  startDate: string;
}

export const claimsCountryOptions: ClaimsFilterOption[] = [
  { label: "United Kingdom", value: "UK" },
  { label: "Australia", value: "AU" },
  { label: "New Zealand", value: "NZ" },
  { label: "Germany", value: "DE" },
  { label: "Austria", value: "AT" },
];

export const claimsBrandOptions: ClaimsFilterOption[] = [
  { label: "BPIS", value: "BPIS" },
  { label: "PetCover", value: "Petcover" },
  { label: "CoverMy", value: "CoverMy" },
  { label: "MiPet", value: "MiPet" },
  { label: "PetId", value: "PetId" },
  { label: "BB Commercial", value: "BB Commercial" },
];

export const claimsPetTypeOptions: ClaimsFilterOption[] = [
  { label: "Cat", value: "Cat" },
  { label: "Dog", value: "Dog" },
  { label: "Horse", value: "Horse" },
  { label: "Exotic", value: "Exotic" },
];

const CLAIMS_V2_BASE_URL = `${API_V2_BASE_URL}/claims`;

const allValuesSelected = (
  selectedValues: string[],
  options: ClaimsFilterOption[],
) => {
  if (selectedValues.length !== options.length) {
    return false;
  }

  const selectedValueSet = new Set(selectedValues);
  return options.every((option) => selectedValueSet.has(option.value));
};

const buildFilterValue = (
  selectedValues: string[],
  options: ClaimsFilterOption[],
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

export const downloadClaimsReport = async ({
  brands,
  countryCodes,
  endDate,
  petTypes,
  profile,
  startDate,
}: DownloadClaimsReportParams) => {
  const url = new URL(`${CLAIMS_V2_BASE_URL}/reports/download`);
  url.searchParams.set("profile", profile);
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set(
    "country_codes",
    buildFilterValue(countryCodes, claimsCountryOptions),
  );
  url.searchParams.set(
    "brands",
    buildFilterValue(brands, claimsBrandOptions),
  );
  url.searchParams.set(
    "pet_types",
    buildFilterValue(petTypes, claimsPetTypeOptions),
  );

  const authToken = authStorage.getToken();
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      method: "GET",
    });
  } catch {
    throw new Error("Unable to reach the backend for the claims export.");
  }

  if (!response.ok) {
    if (authToken && isAuthenticationErrorStatus(response.status)) {
      dispatchSessionExpiredEvent();
    }
    throw new Error(await extractErrorMessage(response));
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const filename = filenameFromContentDisposition(
    response.headers.get("content-disposition"),
    profile === "claims-data"
      ? "ClaimsData.xlsx"
      : "ClaimsTurnaroundTime.xlsx",
  );
  const anchor = document.createElement("a");

  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(downloadUrl);
};
