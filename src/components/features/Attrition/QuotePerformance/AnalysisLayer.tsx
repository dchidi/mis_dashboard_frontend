import clsx from "clsx";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FaXmark } from "react-icons/fa6";
import KeyAlerts from "./KeyAlerts";
import type { KeyAlert, QuoteCardTabConfig, QuoteCardTabKey } from "./types";
import style from "./QuotePerformance.module.css";

interface AnalysisLayerProps {
  activeAnalysisAlerts: KeyAlert[];
  activeAnalysisSummary: string[];
  activePanelTitle: string;
  activeTab: QuoteCardTabKey;
  activeTabConfig: QuoteCardTabConfig;
  analysisSpotlightGraphic: ReactNode;
  analysisSpotlightLabel: string;
  analysisSpotlightMeta: string;
  analysisSpotlightValue: string;
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

const AnalysisLayer: React.FC<AnalysisLayerProps> = ({
  activeAnalysisAlerts,
  activeAnalysisSummary,
  activePanelTitle,
  activeTab,
  activeTabConfig,
  analysisSpotlightGraphic,
  analysisSpotlightLabel,
  analysisSpotlightMeta,
  analysisSpotlightValue,
  children,
  isOpen,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    window.requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const isTrendAnalysis =
    activeTab === "quote-trend" || activeTab === "conversion-trend";

  return createPortal(
    <div
      className={style.analysisOverlay}
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-describedby={`quote-analysis-subtitle-${activeTab}`}
        aria-labelledby={`quote-analysis-title-${activeTab}`}
        aria-modal="true"
        className={clsx(
          style.analysisDrawer,
          isTrendAnalysis && style.analysisDrawerWide,
        )}
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className={style.analysisHeader}>
          <div className={style.analysisHeaderCopy}>
            <div className={style.analysisEyebrow}>Expanded Analysis</div>
            <h3
              className={style.analysisTitle}
              id={`quote-analysis-title-${activeTab}`}
            >
              {activePanelTitle}
            </h3>
            <p
              className={style.analysisSubtitle}
              id={`quote-analysis-subtitle-${activeTab}`}
            >
              {activeTabConfig.subtitle}
            </p>
            <div className={style.analysisSummary}>
              {activeAnalysisSummary.map((item) => (
                <span className={style.analysisChip} key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
          <button
            aria-label={`Close ${activeTabConfig.label.toLowerCase()} analysis`}
            className={style.analysisCloseButton}
            onClick={onClose}
            type="button"
          >
            <FaXmark aria-hidden="true" />
          </button>
        </div>

        <div
          className={clsx(
            style.analysisBody,
            isTrendAnalysis && style.analysisBodyWide,
          )}
        >
          <section className={style.analysisVisualCard}>{children}</section>

          <aside className={style.analysisSidebar}>
            <section className={style.analysisSpotlight}>
              <span className={style.analysisSpotlightLabel}>
                {analysisSpotlightLabel}
              </span>
              <div className={style.analysisSpotlightRow}>
                {analysisSpotlightGraphic}
                <strong className={style.analysisSpotlightValue}>
                  {analysisSpotlightValue}
                </strong>
              </div>
              <p className={style.analysisSpotlightMeta}>
                {analysisSpotlightMeta}
              </p>
            </section>

            <KeyAlerts alerts={activeAnalysisAlerts} />
          </aside>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default AnalysisLayer;
