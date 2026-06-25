import dayjs from "dayjs";
import type {
  V2EtlDateRange,
  V2EtlEvent,
  V2EtlJob,
  V2EtlJobKey,
  V2EtlRouteKey,
  V2EtlRouteOption,
} from "./types";

const V2_ETL_JOB_DEFINITIONS: Array<{ key: V2EtlJobKey; label: string }> = [
  { key: "free-policy", label: "Free Policy ETL" },
];

export const V2_ETL_ROUTE_OPTIONS: V2EtlRouteOption[] = [
  {
    caption: "Sequence",
    description:
      "Runs every registered v2 ETL job in order. The current sequence includes Free Policy ETL and expands as more v2 jobs are added.",
    jobKeys: ["free-policy"],
    key: "all",
    label: "Run All V2 ETL",
  },
  {
    caption: "Individual",
    description:
      "Runs only the free-policy v2 extraction for the date window you choose.",
    jobKeys: ["free-policy"],
    key: "free-policy",
    label: "Free Policy ETL",
  },
];

export const createDefaultV2EtlDateRange = (): V2EtlDateRange => [
  dayjs().subtract(365, "day").format("YYYY-MM-DD"),
  dayjs().format("YYYY-MM-DD"),
];

export const createInitialV2EtlJobs = (
  jobKeys: V2EtlJobKey[] = V2_ETL_JOB_DEFINITIONS.map((job) => job.key),
): V2EtlJob[] =>
  V2_ETL_JOB_DEFINITIONS.filter((job) => jobKeys.includes(job.key)).map(
    (job) => ({
      key: job.key,
      label: job.label,
      message: "Queued",
      state: "pending",
    }),
  );

export const formatV2EtlTime = (): string =>
  new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

export const formatV2EtlDateTime = (value: string | null): string => {
  if (!value) {
    return "No load recorded";
  }

  const normalized = dayjs(value);
  if (!normalized.isValid()) {
    return value;
  }

  return normalized.format("DD MMM YYYY, HH:mm");
};

export const formatV2EtlDateRange = (value: V2EtlDateRange): string => {
  const [startDate, endDate] = value;
  if (!startDate || !endDate) {
    return "No date window selected";
  }

  return `${dayjs(startDate).format("DD MMM YYYY")} - ${dayjs(endDate).format("DD MMM YYYY")}`;
};

export const normalizeV2EtlText = (
  value: unknown,
  fallback = "",
): string => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (typeof value === "object" && value !== null) {
    const payload = value as {
      detail?: unknown;
      message?: unknown;
      status?: unknown;
    };

    if (typeof payload.detail === "string" && payload.detail.trim()) {
      return payload.detail.trim();
    }

    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message.trim();
    }

    if (typeof payload.status === "string" && payload.status.trim()) {
      return payload.status
        .trim()
        .replace(/_/g, " ")
        .replace(/^./, (character) => character.toUpperCase());
    }

    try {
      return JSON.stringify(payload);
    } catch {
      return fallback;
    }
  }

  return fallback;
};

export const getV2EtlErrorMessage = (error: unknown): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: number }).status === "number" &&
    [401, 403].includes((error as { status?: number }).status ?? 0)
  ) {
    return "Your session expired or no longer has administrator access. Sign in again and rerun ETL.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "The ETL request failed.";
};

export const buildV2EtlEvent = (
  text: string,
  timestamp: string,
  index: number,
): V2EtlEvent => ({
  id: `${Date.now()}-${index}`,
  text,
  timestamp,
});

export const getV2EtlRouteOption = (
  routeKey: V2EtlRouteKey,
): V2EtlRouteOption =>
  V2_ETL_ROUTE_OPTIONS.find((option) => option.key === routeKey) ??
  V2_ETL_ROUTE_OPTIONS[0];
