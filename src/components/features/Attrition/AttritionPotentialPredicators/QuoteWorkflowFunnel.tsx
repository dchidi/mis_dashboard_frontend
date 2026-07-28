import { type CSSProperties, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaXmark } from "react-icons/fa6";
import { RiDownloadCloud2Line, RiLoader4Line } from "react-icons/ri";

import Card from "../../../ui/card/Card";
import InsightButton from "../../../ui/insight_button";
import InsightPanel from "../../../ui/insight_panel";
import Table, { type TableColumn } from "../../../ui/table/Table";
import {
  type QuoteWorkflowCardData,
  type QuoteWorkflowCountryRow,
  type QuoteWorkflowFunnelLayer,
  type QuoteWorkflowPetTypeRow,
} from "../data";
import type { AttritionComponentProps } from "../type";
import style from "./AttritionPotentialPredicators.module.css";

interface QuoteWorkflowFunnelProps extends AttritionComponentProps {
  data: QuoteWorkflowCardData;
  downloadDisabled?: boolean;
  isDownloadInProgress?: boolean;
  onDownload?: () => void;
  reportingPeriodLabel?: string;
}

const FUNNEL_WIDTHS = [100, 86, 72, 58];

const formatCount = (value: number) => value.toLocaleString();
const formatPercent = (value: number) => `${value}%`;

const countryColumns: TableColumn<QuoteWorkflowCountryRow>[] = [
  {
    header: "Country",
    isRowHeader: true,
    key: "country",
    render: (row) => (
      <span className={style.workflowCountry}>
        <strong>{row.countryCode}</strong>
        <span>{row.country}</span>
      </span>
    ),
    width: "25%",
  },
  {
    cellAlign: "right",
    header: "Total Quotes",
    headerAlign: "right",
    key: "total-quotes",
    render: (row) => formatCount(row.totalQuotes),
    width: "15%",
  },
  {
    cellAlign: "right",
    header: "Pending",
    headerAlign: "right",
    key: "pending",
    render: (row) => formatCount(row.pendingQuotes),
    width: "15%",
  },
  {
    cellAlign: "right",
    header: "Lapsed",
    headerAlign: "right",
    key: "lapsed",
    render: (row) => formatCount(row.lapsedQuotes),
    width: "15%",
  },
  {
    cellAlign: "right",
    header: "Converted",
    headerAlign: "right",
    key: "converted",
    render: (row) => formatCount(row.convertedQuotes),
    width: "15%",
  },
  {
    cellAlign: "right",
    header: "Conversion %",
    headerAlign: "right",
    key: "conversion",
    render: (row) => formatPercent(row.conversionRate),
    width: "15%",
  },
];

const petTypeColumns: TableColumn<QuoteWorkflowPetTypeRow>[] = [
  {
    header: "Pet Type",
    isRowHeader: true,
    key: "pet-type",
    render: (row) => row.petType,
    width: "25%",
  },
  {
    cellAlign: "right",
    header: "Total Quotes",
    headerAlign: "right",
    key: "total-quotes",
    render: (row) => formatCount(row.totalQuotes),
    width: "15%",
  },
  {
    cellAlign: "right",
    header: "Pending",
    headerAlign: "right",
    key: "pending",
    render: (row) => formatCount(row.pendingQuotes),
    width: "15%",
  },
  {
    cellAlign: "right",
    header: "Lapsed",
    headerAlign: "right",
    key: "lapsed",
    render: (row) => formatCount(row.lapsedQuotes),
    width: "15%",
  },
  {
    cellAlign: "right",
    header: "Converted",
    headerAlign: "right",
    key: "converted",
    render: (row) => formatCount(row.convertedQuotes),
    width: "15%",
  },
  {
    cellAlign: "right",
    header: "Conversion %",
    headerAlign: "right",
    key: "conversion",
    render: (row) => formatPercent(row.conversionRate),
    width: "15%",
  },
];

const QuoteWorkflowFunnel: React.FC<QuoteWorkflowFunnelProps> = ({
  className,
  data,
  downloadDisabled = false,
  isDownloadInProgress = false,
  onDownload,
  reportingPeriodLabel,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const layers = data.funnelLayers ?? [];
  const countryRows = data.countryRows ?? [];
  const petTypeRows = data.petTypeRows ?? [];
  const workflowTitle = data.title ?? "Quote Workflow";
  const workflowIdBase = data.idBase ?? "quote-workflow";

  useEffect(() => {
    if (!isExpanded || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    window.requestAnimationFrame(() => modalRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  const renderFunnel = (
    funnelLayers: QuoteWorkflowFunnelLayer[],
    expanded: boolean,
  ) => (
    <section
      aria-label="Quote workflow funnel"
      className={`${style.funnelPanel} ${
        expanded ? style.funnelPanelExpanded : ""
      }`}
    >
      <div className={style.funnelStack}>
        {funnelLayers.map((layer, index) => (
          <div className={style.funnelLayerRow} key={layer.key}>
            <div
              aria-label={`${layer.label}: ${formatCount(
                layer.count,
              )}, ${formatPercent(layer.share)} of total quotes`}
              className={style.funnelLayer}
              style={
                {
                  "--funnel-color": layer.color,
                  "--funnel-width": `${
                    FUNNEL_WIDTHS[index] ??
                    FUNNEL_WIDTHS[FUNNEL_WIDTHS.length - 1]
                  }%`,
                } as CSSProperties
              }
            >
              <span className={style.funnelLayerLabel}>{layer.label}</span>
              <span className={style.funnelLayerMetric}>
                <strong>{formatCount(layer.count)}</strong>
                <span>{formatPercent(layer.share)}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const expandedLayer =
    isExpanded && typeof document !== "undefined"
      ? createPortal(
          <div
            className={style.modalOverlay}
            onClick={() => setIsExpanded(false)}
            role="presentation"
          >
            <div
              aria-labelledby={`${workflowIdBase}-funnel-modal-title`}
              aria-modal="true"
              className={`${style.modal} ${style.funnelModal}`}
              onClick={(event) => event.stopPropagation()}
              ref={modalRef}
              role="dialog"
              tabIndex={-1}
            >
              <div className={style.modalHeader}>
                <div>
                  <div className={style.modalEyebrow}>Expanded View</div>
                  <h3
                    className={style.modalTitle}
                    id={`${workflowIdBase}-funnel-modal-title`}
                  >
                    {workflowTitle}
                  </h3>
                </div>
                <div className={style.modalActions}>
                  {onDownload ? (
                    <button
                      aria-busy={isDownloadInProgress}
                      aria-label="Download Quote Workflow raw data"
                      className={style.downloadButton}
                      disabled={downloadDisabled || isDownloadInProgress}
                      onClick={onDownload}
                      title="Download raw Quote Workflow data"
                      type="button"
                    >
                      {isDownloadInProgress ? (
                        <RiLoader4Line
                          aria-hidden="true"
                          className={style.downloadSpinner}
                        />
                      ) : (
                        <RiDownloadCloud2Line aria-hidden="true" />
                      )}
                    </button>
                  ) : null}
                  <button
                    aria-label="Close quote workflow expanded view"
                    className={style.closeButton}
                    onClick={() => setIsExpanded(false)}
                    type="button"
                  >
                    <FaXmark aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className={style.expandedStack}>
                <div className={style.expandedTopGrid}>
                  {renderFunnel(layers, true)}
                  <InsightPanel
                    accentRgb="138, 116, 232"
                    items={data.insights ?? []}
                  />
                </div>

                <section
                  aria-labelledby={`${workflowIdBase}-country-breakdown-title`}
                  className={style.workflowTableSection}
                >
                  <div className={style.workflowTableHeader}>
                    <h4 id={`${workflowIdBase}-country-breakdown-title`}>
                      Country Breakdown
                    </h4>
                    <span>All workflow stages</span>
                  </div>
                  <Table
                    className={style.expandedTableRegion}
                    columns={countryColumns}
                    layout="fixed"
                    minWidth="52rem"
                    mobileMinWidth="52rem"
                    rowKey={(row) => row.countryCode}
                    rows={countryRows}
                    size="small"
                    stickySpacerWidth="0.55rem"
                  />
                </section>
                <section
                  aria-labelledby={`${workflowIdBase}-pet-type-breakdown-title`}
                  className={style.workflowTableSection}
                >
                  <div className={style.workflowTableHeader}>
                    <h4 id={`${workflowIdBase}-pet-type-breakdown-title`}>
                      Pet Type Breakdown
                    </h4>
                    <span>Pending, lapsed and converted</span>
                  </div>
                  <Table
                    className={style.expandedTableRegion}
                    columns={petTypeColumns}
                    layout="fixed"
                    minWidth="48rem"
                    mobileMinWidth="48rem"
                    rowKey={(row) => row.petType}
                    rows={petTypeRows}
                    size="small"
                    stickySpacerWidth="0.55rem"
                  />
                </section>
              </div>

              <footer className={style.modalFooter}>
                <div className={style.reportingPeriod}>
                  Reporting period: {reportingPeriodLabel ?? "Current selection"}
                </div>
              </footer>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <Card className={className}>
        <div className={style.funnelRoot}>
          <div className={style.topline}>
            <div className={`cardTitle ${style.outerTitle}`}>{workflowTitle}</div>
            <InsightButton
              accentRgb="138, 116, 232"
              ariaLabel="Open quote workflow insights"
              onClick={() => setIsExpanded(true)}
              title="View quote workflow insights"
            />
          </div>
          {renderFunnel(layers, false)}
        </div>
      </Card>

      {expandedLayer}
    </>
  );
};

export default QuoteWorkflowFunnel;
