const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

if (!configuredApiBaseUrl) {
  throw new Error("VITE_API_BASE_URL is not configured.");
}

export const API_BASE_URL = new URL(
  configuredApiBaseUrl.replace(/\/+$/, ""),
  window.location.origin,
)
  .toString()
  .replace(/\/+$/, "");
export const API_V1_BASE_URL = `${API_BASE_URL}/v1`;
export const API_V2_BASE_URL = `${API_BASE_URL}/v2`;
