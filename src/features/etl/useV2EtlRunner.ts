import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DashboardDateRange } from "../../components/layout/DashboardLayout/DashboardLayout";
import {
  etlV2Service,
  type V2EtlRunResponse,
  type V2EtlStatusResponse,
} from "../../services/etlV2";
import { publishV2EtlDataRefresh } from "./dataRefresh";
import type {
  V2EtlDateRange,
  V2EtlEvent,
  V2EtlJob,
  V2EtlJobKey,
  V2EtlRouteKey,
  V2EtlRouteOption,
  V2EtlStatusSummary,
} from "./types";
import {
  buildV2EtlEvent,
  createDefaultV2EtlDateRange,
  createInitialV2EtlJobs,
  formatV2EtlDateRange,
  formatV2EtlTime,
  getV2EtlErrorMessage,
  getV2EtlRouteOption,
  normalizeV2EtlText,
  V2_ETL_ROUTE_OPTIONS,
} from "./utils";

const INITIAL_HEADLINE =
  "Choose a v2 ETL route, adjust the date window if needed, then run the job.";

const mapStatusSummary = (
  payload: V2EtlStatusResponse,
): V2EtlStatusSummary => ({
  currentDate: payload.current_date,
  isCurrent: payload.is_current,
  lastLoadedAt: payload.last_loaded_at,
  tableName: payload.table_name,
  totalRows: payload.total_rows,
});

interface UseV2EtlRunnerResult {
  activeRouteOption: V2EtlRouteOption;
  closeModal: () => void;
  completedAt: string | null;
  dateRange: DashboardDateRange;
  etlEvents: V2EtlEvent[];
  etlHeadline: string;
  etlJobs: V2EtlJob[];
  isEtlModalOpen: boolean;
  isEtlRunning: boolean;
  isStatusLoading: boolean;
  openModal: () => void;
  resetDateRange: () => void;
  resetEtlState: () => void;
  routeOptions: V2EtlRouteOption[];
  runSelectedEtl: () => Promise<void>;
  selectedRouteKey: V2EtlRouteKey;
  setDateRange: (value: V2EtlDateRange) => void;
  setSelectedRouteKey: (value: V2EtlRouteKey) => void;
  startedAt: string | null;
  statusError: string | null;
  statusSummary: V2EtlStatusSummary | null;
}

export const useV2EtlRunner = (): UseV2EtlRunnerResult => {
  const statusAbortRef = useRef<AbortController | null>(null);
  const runAbortRef = useRef<AbortController | null>(null);
  const [isEtlModalOpen, setIsEtlModalOpen] = useState(false);
  const [isEtlRunning, setIsEtlRunning] = useState(false);
  const [selectedRouteKey, setSelectedRouteKey] =
    useState<V2EtlRouteKey>("all");
  const [dateRange, setDateRange] = useState<V2EtlDateRange>(
    createDefaultV2EtlDateRange(),
  );
  const [etlHeadline, setEtlHeadline] = useState(INITIAL_HEADLINE);
  const [etlJobs, setEtlJobs] = useState<V2EtlJob[]>(
    createInitialV2EtlJobs(getV2EtlRouteOption("all").jobKeys),
  );
  const [etlEvents, setEtlEvents] = useState<V2EtlEvent[]>([]);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [statusSummary, setStatusSummary] = useState<V2EtlStatusSummary | null>(
    null,
  );
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const activeRouteOption = useMemo(
    () => getV2EtlRouteOption(selectedRouteKey),
    [selectedRouteKey],
  );
  const statusJobKey = activeRouteOption.jobKeys[0];

  useEffect(
    () => () => {
      statusAbortRef.current?.abort();
      runAbortRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    setEtlJobs(createInitialV2EtlJobs(activeRouteOption.jobKeys));
    setEtlHeadline(INITIAL_HEADLINE);
    setEtlEvents([]);
    setStartedAt(null);
    setCompletedAt(null);
  }, [activeRouteOption]);

  const statusLoader = useMemo(
    () => ({
      "free-policy": etlV2Service.getFreePolicyStatus,
      quote: etlV2Service.getQuoteStatus,
    }),
    [],
  );

  const jobRunner = useMemo(
    () => ({
      "free-policy": etlV2Service.runFreePolicy,
      quote: etlV2Service.runQuote,
    }),
    [],
  );

  const appendEtlEvent = useCallback((text: string) => {
    const timestamp = formatV2EtlTime();
    setEtlEvents((current) => [
      ...current,
      buildV2EtlEvent(text, timestamp, current.length),
    ]);
  }, []);

  const updateEtlJob = useCallback(
    (key: V2EtlJobKey, updates: Partial<V2EtlJob>) => {
      setEtlJobs((current) =>
        current.map((job) =>
          job.key === key
            ? {
                ...job,
                ...updates,
              }
            : job,
        ),
      );
    },
    [],
  );

  const loadStatus = useCallback(async () => {
    statusAbortRef.current?.abort();
    const controller = new AbortController();
    statusAbortRef.current = controller;
    setIsStatusLoading(true);
    setStatusError(null);

    try {
      const response = await statusLoader[statusJobKey](controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      setStatusSummary(mapStatusSummary(response));
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      setStatusError(getV2EtlErrorMessage(error));
    } finally {
      if (statusAbortRef.current === controller) {
        statusAbortRef.current = null;
      }
      if (!controller.signal.aborted) {
        setIsStatusLoading(false);
      }
    }
  }, [statusJobKey, statusLoader]);

  useEffect(() => {
    if (!isEtlModalOpen) {
      return;
    }
    void loadStatus();
  }, [isEtlModalOpen, loadStatus]);

  const openModal = useCallback(() => {
    setIsEtlModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsEtlModalOpen(false);
  }, []);

  const resetDateRange = useCallback(() => {
    setDateRange(createDefaultV2EtlDateRange());
  }, []);

  const resetEtlState = useCallback(() => {
    setDateRange(createDefaultV2EtlDateRange());
    setEtlHeadline(INITIAL_HEADLINE);
    setEtlJobs(createInitialV2EtlJobs(activeRouteOption.jobKeys));
    setEtlEvents([]);
    setStartedAt(null);
    setCompletedAt(null);
    setStatusError(null);
  }, [activeRouteOption.jobKeys]);

  const runSelectedEtl = useCallback(async () => {
    const [startDate, endDate] = dateRange;
    if (!startDate || !endDate || isEtlRunning) {
      return;
    }

    runAbortRef.current?.abort();
    const controller = new AbortController();
    runAbortRef.current = controller;
    const startedStamp = formatV2EtlTime();
    const routeLabel = activeRouteOption.label;
    const formattedDateRange = formatV2EtlDateRange(dateRange);

    setIsEtlRunning(true);
    setStatusError(null);
    setEtlJobs(createInitialV2EtlJobs(activeRouteOption.jobKeys));
    setEtlEvents([
      buildV2EtlEvent(
        `${routeLabel} started for ${formattedDateRange}.`,
        startedStamp,
        0,
      ),
    ]);
    setStartedAt(startedStamp);
    setCompletedAt(null);
    setEtlHeadline(
      activeRouteOption.key === "all"
        ? "Running all v2 ETL jobs..."
        : `Running ${routeLabel}...`,
    );

    activeRouteOption.jobKeys.forEach((jobKey) => {
      updateEtlJob(jobKey, {
        message: `Running for ${formattedDateRange}`,
        state: "running",
      });
    });

    try {
      if (activeRouteOption.key === "all") {
        const response = await etlV2Service.runAll({
          endDate,
          signal: controller.signal,
          startDate,
        });

        response.jobs.forEach((job) => {
          const jobKey = job.key as V2EtlJobKey;
          const rowsLoaded = job.rows_loaded ?? 0;
          const completionMessage = `${rowsLoaded.toLocaleString("en-GB")} rows loaded`;
          updateEtlJob(jobKey, {
            message: normalizeV2EtlText(job.load_status, completionMessage),
            rowsLoaded,
            state: "completed",
          });
          appendEtlEvent(`${job.label} completed. ${completionMessage}.`);
        });

        setEtlHeadline("All v2 ETL jobs completed successfully.");
      } else {
        const selectedJobKey = activeRouteOption.key as V2EtlJobKey;
        const response: V2EtlRunResponse = await jobRunner[selectedJobKey]({
          endDate,
          signal: controller.signal,
          startDate,
        });
        const rowsLoaded = response.rows_loaded ?? 0;
        const completionMessage = `${rowsLoaded.toLocaleString("en-GB")} rows loaded`;

        updateEtlJob(selectedJobKey, {
          message: normalizeV2EtlText(response.load_status, completionMessage),
          regionsLoaded: response.regions.length,
          rowsLoaded,
          state: "completed",
        });
        appendEtlEvent(
          `${activeRouteOption.label} completed. ${completionMessage} across ${response.regions.length} regions.`,
        );
        setEtlHeadline(`${activeRouteOption.label} completed successfully.`);
      }

      try {
        await loadStatus();
      } catch {
        // Ignore status refresh errors because the ETL run itself succeeded.
      }

      setCompletedAt(formatV2EtlTime());
      publishV2EtlDataRefresh({
        completedAt: new Date().toISOString(),
        endDate,
        jobKeys: [...activeRouteOption.jobKeys],
        startDate,
      });
      appendEtlEvent("Platform data refresh triggered.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      const message = getV2EtlErrorMessage(error);
      activeRouteOption.jobKeys.forEach((jobKey) => {
        updateEtlJob(jobKey, {
          message,
          state: "failed",
        });
      });
      setEtlHeadline(`${routeLabel} failed.`);
      appendEtlEvent(`${routeLabel} failed. ${message}`);
      setCompletedAt(formatV2EtlTime());
    } finally {
      if (runAbortRef.current === controller) {
        runAbortRef.current = null;
      }
      if (!controller.signal.aborted) {
        setIsEtlRunning(false);
      }
    }
  }, [
    activeRouteOption,
    appendEtlEvent,
    dateRange,
    isEtlRunning,
    jobRunner,
    loadStatus,
    updateEtlJob,
  ]);

  return {
    activeRouteOption,
    closeModal,
    completedAt,
    dateRange,
    etlEvents,
    etlHeadline,
    etlJobs,
    isEtlModalOpen,
    isEtlRunning,
    isStatusLoading,
    openModal,
    resetDateRange,
    resetEtlState,
    routeOptions: V2_ETL_ROUTE_OPTIONS,
    runSelectedEtl,
    selectedRouteKey,
    setDateRange,
    setSelectedRouteKey,
    startedAt,
    statusError,
    statusSummary,
  };
};
