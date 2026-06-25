import {
  authStorage,
  dispatchSessionExpiredEvent,
  isAuthenticationErrorStatus,
} from "./auth";

export interface V2FreePolicyEtlRegionResult {
  country_code: string;
  country_name: string;
  rows_extracted: number;
}

export interface V2FreePolicyEtlRunResponse {
  load_status: Record<string, unknown>;
  meta: Record<string, unknown>;
  regions: V2FreePolicyEtlRegionResult[];
  rows_loaded: number;
}

export interface V2FreePolicyEtlStatusResponse {
  current_date: string;
  is_current: boolean;
  last_loaded_at: string | null;
  last_loaded_date: string | null;
  load_column: string;
  table_name: string;
  total_rows: number;
}

export interface V2EtlJobRunResponse {
  key: string;
  label: string;
  load_status: Record<string, unknown>;
  meta: Record<string, unknown>;
  rows_loaded: number;
}

export interface V2EtlRunSequenceResponse {
  job_count: number;
  jobs: V2EtlJobRunResponse[];
  sequence: string;
}

interface V2EtlRequestParams {
  endDate: string;
  signal?: AbortSignal;
  startDate: string;
}

const V2_ETL_BASE_URL =
  import.meta.env.VITE_API_V2_ETL_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:8000/api/v2/etl";

const buildUrl = (
  path: string,
  params?: Record<string, string | undefined>,
): URL => {
  const url = new URL(`${V2_ETL_BASE_URL}${path}`);

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

const authenticatedFetch = async <T>(
  path: string,
  params?: Record<string, string | undefined>,
  signal?: AbortSignal,
): Promise<T> => {
  const authToken = authStorage.getToken();
  const url = buildUrl(path, params);

  if (authToken) {
    url.searchParams.set("auth_token", authToken);
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : undefined,
      method: "GET",
      signal,
    });
  } catch {
    throw new Error(
      `Unable to reach the backend at ${V2_ETL_BASE_URL}. Start the backend and try again.`,
    );
  }

  if (!response.ok) {
    if (authToken && isAuthenticationErrorStatus(response.status)) {
      dispatchSessionExpiredEvent();
    }

    const error = new Error(await extractErrorMessage(response)) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  return (await response.json()) as T;
};

export const etlV2Service = {
  getFreePolicyStatus: (signal?: AbortSignal) =>
    authenticatedFetch<V2FreePolicyEtlStatusResponse>(
      "/free-policy/status",
      undefined,
      signal,
    ),

  runAll: ({ endDate, signal, startDate }: V2EtlRequestParams) =>
    authenticatedFetch<V2EtlRunSequenceResponse>(
      "/run",
      {
        end_date: endDate,
        start_date: startDate,
      },
      signal,
    ),

  runFreePolicy: ({ endDate, signal, startDate }: V2EtlRequestParams) =>
    authenticatedFetch<V2FreePolicyEtlRunResponse>(
      "/free-policy/run",
      {
        end_date: endDate,
        start_date: startDate,
      },
      signal,
    ),
};
