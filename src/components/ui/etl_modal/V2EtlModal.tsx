import { useEffect } from "react";
import { DatePickerInput } from "@mantine/dates";
import { useMediaQuery } from "@mantine/hooks";
import {
  RiCheckboxCircleLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiLoader4Line,
  RiPlayCircleLine,
  RiTimeLine,
} from "react-icons/ri";
import type { DashboardDateRange } from "../../layout/DashboardLayout/DashboardLayout";
import type {
  V2EtlEvent,
  V2EtlJob,
  V2EtlJobState,
  V2EtlRouteKey,
  V2EtlRouteOption,
  V2EtlStatusSummary,
} from "../../../features/etl/types";
import {
  formatV2EtlDateRange,
  formatV2EtlDateTime,
  normalizeV2EtlText,
} from "../../../features/etl/utils";
import style from "./V2EtlModal.module.css";

interface V2EtlModalProps {
  activeRouteOption: V2EtlRouteOption;
  completedAt: string | null;
  dateRange: DashboardDateRange;
  etlEvents: V2EtlEvent[];
  etlHeadline: string;
  etlJobs: V2EtlJob[];
  isOpen: boolean;
  isRunning: boolean;
  isStatusLoading: boolean;
  onClose: () => void;
  onDateRangeChange: (value: DashboardDateRange) => void;
  onResetDateRange: () => void;
  onResetState: () => void;
  onRun: () => void;
  onSelectRoute: (value: V2EtlRouteKey) => void;
  routeOptions: V2EtlRouteOption[];
  selectedRouteKey: V2EtlRouteKey;
  startedAt: string | null;
  statusError: string | null;
  statusSummary: V2EtlStatusSummary | null;
}

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

const renderStatusIcon = (state: V2EtlJobState) => {
  if (state === "running") {
    return <RiLoader4Line className={style.jobIconSpin} />;
  }

  if (state === "completed") {
    return <RiCheckboxCircleLine />;
  }

  if (state === "failed") {
    return <RiErrorWarningLine />;
  }

  return <RiTimeLine />;
};

const V2EtlModal: React.FC<V2EtlModalProps> = ({
  activeRouteOption,
  completedAt,
  dateRange,
  etlEvents,
  etlHeadline,
  etlJobs,
  isOpen,
  isRunning,
  isStatusLoading,
  onClose,
  onDateRangeChange,
  onResetDateRange,
  onResetState,
  onRun,
  onSelectRoute,
  routeOptions,
  selectedRouteKey,
  startedAt,
  statusError,
  statusSummary,
}) => {
  const isMobile = useMediaQuery("(max-width: 640px)") ?? false;
  const canRun = Boolean(dateRange[0] && dateRange[1] && !isRunning);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={style.overlay} onClick={onClose}>
      <div
        aria-labelledby="v2-etl-modal-title"
        aria-modal="true"
        className={style.modal}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className={style.header}>
          <div>
            <span className={style.kicker}>Administrator</span>
            <h2 className={style.title} id="v2-etl-modal-title">
              Run ETL
            </h2>
            <p className={style.copy}>
              Choose a v2 ETL route, run the full sequence when needed, and
              override the default 365-day ETL window for backfills or targeted
              reruns.
            </p>
          </div>

          <div className={style.headerActions}>
            <span
              className={`${style.statusPill} ${
                isRunning ? style.statusPillRunning : style.statusPillIdle
              }`}
            >
              {isRunning ? "Running" : "Idle"}
            </span>
            <button
              aria-label="Close ETL modal"
              className={style.closeButton}
              onClick={onClose}
              type="button"
            >
              <RiCloseLine />
            </button>
          </div>
        </div>

        <div className={style.summaryGrid}>
          <div className={style.summaryCard}>
            <span>Current status</span>
            <strong>{etlHeadline}</strong>
          </div>
          <div className={style.summaryCard}>
            <span>Selected window</span>
            <strong>{formatV2EtlDateRange(dateRange)}</strong>
          </div>
          <div className={style.summaryCard}>
            <span>Last recorded load</span>
            <strong>
              {isStatusLoading
                ? "Loading status..."
                : formatV2EtlDateTime(statusSummary?.lastLoadedAt ?? null)}
            </strong>
          </div>
          <div className={style.summaryCard}>
            <span>Table status</span>
            <strong>
              {statusSummary
                ? `${statusSummary.totalRows.toLocaleString("en-GB")} rows${
                    statusSummary.isCurrent ? " • Current" : " • Not current"
                  }`
                : isStatusLoading
                  ? "Loading status..."
                  : "Status unavailable"}
            </strong>
          </div>
        </div>

        <div className={style.section}>
          <div className={style.sectionHeader}>
            <div>
              <span className={style.sectionKicker}>Route selection</span>
              <strong>{activeRouteOption.label}</strong>
            </div>
            <span className={style.sectionMeta}>
              {routeOptions.length} available routes
            </span>
          </div>

          <div className={style.routeGrid}>
            {routeOptions.map((option) => (
              <button
                className={`${style.routeCard} ${
                  option.key === selectedRouteKey ? style.routeCardActive : ""
                }`}
                disabled={isRunning}
                key={option.key}
                onClick={() => onSelectRoute(option.key)}
                type="button"
              >
                <span className={style.routeTag}>{option.caption}</span>
                <strong className={style.routeTitle}>{option.label}</strong>
                <span className={style.routeDescription}>
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className={style.section}>
          <div className={style.sectionHeader}>
            <div>
              <span className={style.sectionKicker}>Date override</span>
              <strong>ETL reporting window</strong>
            </div>
            <button
              className={style.ghostButton}
              disabled={isRunning}
              onClick={onResetDateRange}
              type="button"
            >
              Use default window
            </button>
          </div>

          <div className={style.dateField}>
            <DatePickerInput
              aria-label="Select ETL date range"
              dropdownType={isMobile ? "modal" : "popover"}
              onChange={onDateRangeChange}
              placeholder="Select ETL window"
              popoverProps={{ withinPortal: true, zIndex: 3200 }}
              styles={datePickerStyles}
              allowSingleDateInRange
                type="range"
              value={dateRange}
              valueFormat="DD MMM YYYY"
            />
            <p className={style.dateHint}>
              Default backend window is the last 365 days up to today. Change
              it only when you need a targeted rerun or backfill.
            </p>
          </div>
        </div>

        {statusError ? (
          <div className={style.errorBanner}>{statusError}</div>
        ) : null}

        <div className={style.jobList}>
          {etlJobs.map((job) => (
            <div
              className={`${style.jobCard} ${
                job.state === "running"
                  ? style.jobCardRunning
                  : job.state === "completed"
                    ? style.jobCardCompleted
                    : job.state === "failed"
                      ? style.jobCardFailed
                      : ""
              }`}
              key={job.key}
            >
              <div className={style.jobHeader}>
                <div className={style.jobTitle}>
                  <span className={style.jobIcon}>{renderStatusIcon(job.state)}</span>
                  <strong>{job.label}</strong>
                </div>
                <span className={style.jobState}>{job.state}</span>
              </div>
              <p className={style.jobMessage}>
                {normalizeV2EtlText(job.message, "Unavailable")}
              </p>
              <div className={style.jobMetaRow}>
                {typeof job.rowsLoaded === "number" ? (
                  <span>Rows loaded: {job.rowsLoaded.toLocaleString("en-GB")}</span>
                ) : (
                  <span>Rows loaded: --</span>
                )}
                {typeof job.regionsLoaded === "number" ? (
                  <span>Regions: {job.regionsLoaded}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className={style.eventPanel}>
          <div className={style.eventHeader}>
            <strong>Activity log</strong>
            <span>{etlEvents.length} updates</span>
          </div>
          <div className={style.eventList}>
            {etlEvents.length === 0 ? (
              <div className={style.eventEmpty}>
                No ETL activity has been recorded yet.
              </div>
            ) : (
              etlEvents.map((event) => (
                <div className={style.eventItem} key={event.id}>
                  <span>{event.timestamp}</span>
                  <strong>{event.text}</strong>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={style.footerMeta}>
          <span>Started: {startedAt ?? "--"}</span>
          <span>Completed: {completedAt ?? (isRunning ? "In progress" : "--")}</span>
          <span>Status source: {statusSummary?.tableName ?? "--"}</span>
        </div>

        <div className={style.actions}>
          <button
            className={style.secondaryButton}
            disabled={isRunning}
            onClick={onResetState}
            type="button"
          >
            Reset status
          </button>
          <button
            className={style.secondaryButton}
            onClick={onClose}
            type="button"
          >
            Close
          </button>
          <button
            className={style.primaryButton}
            disabled={!canRun}
            onClick={onRun}
            type="button"
          >
            <RiPlayCircleLine />
            {isRunning
              ? "Running..."
              : selectedRouteKey === "all"
                ? "Run all"
                : "Run selected route"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default V2EtlModal;
