import { type CSSProperties } from "react";
import { RiDownloadCloud2Line } from "react-icons/ri";
import Card from "../../../ui/card/Card";
import { type ProductPerformanceCardData } from "../data";
import type { TrendSeriesKey } from "../QuotePerformance/types";
import type { AttritionComponentProps } from "../type";
import style from "./ProductPerformance.module.css";

interface ProductPerformanceProps extends AttritionComponentProps {
  activeTrendSeriesKey: TrendSeriesKey;
  data?: ProductPerformanceCardData;
  downloadDisabled?: boolean;
  isDownloadInProgress?: boolean;
  onDownload?: () => void;
}

const ProductPerformance: React.FC<ProductPerformanceProps> = ({
  activeTrendSeriesKey,
  className,
  data,
  downloadDisabled = false,
  isDownloadInProgress = false,
  onDownload,
}) => {
  const activeView = data?.volume?.[activeTrendSeriesKey];

  if (!activeView) {
    return null;
  }

  const rootStyle = {
    "--accent-rgb": activeView.accentRgb,
  } as CSSProperties;

  return (
    <Card className={className}>
      <div className={style.root} style={rootStyle}>
        <div className={style.header}>
          <div className="cardTitle">{activeView.title}</div>

          <div className={style.headerAside}>
            <div className={style.summary}>
              <span className={style.summaryLabel}>Top 5 Share</span>
              <strong className={style.summaryValue}>{activeView.summaryValue}</strong>
            </div>

            {onDownload ? (
              <button
                aria-label={
                  isDownloadInProgress
                    ? "Downloading quote volume raw data"
                    : "Download quote volume raw data"
                }
                className={style.downloadButton}
                disabled={downloadDisabled || isDownloadInProgress}
                onClick={onDownload}
                title="Download quote volume raw data"
                type="button"
              >
                <RiDownloadCloud2Line className={style.downloadButtonIcon} />
              </button>
            ) : null}
          </div>
        </div>

        <section className={style.panelBody}>
          <div className={style.panelContent}>
            <div className={style.list}>
              {activeView.rows.map((row) => (
                <div
                  className={style.row}
                  key={`${row.product}-${row.petType}`}
                  title={`${row.product} (${row.petType}): ${row.metricDisplay}`}
                >
                  <div className={style.rowTop}>
                    <div className={style.identity}>
                      <span className={style.rank}>{row.rankLabel}</span>
                      <div className={style.identityText}>
                        <span className={style.productName}>{row.product}</span>
                        <span className={style.petType}>{row.petType}</span>
                      </div>
                    </div>

                    <div className={style.metricGroup}>
                      <span className={style.metricValue}>{row.metricDisplay}</span>
                      <span className={style.metricMeta}>{row.metaDisplay}</span>
                    </div>
                  </div>

                  <div className={style.track}>
                    <span
                      className={style.fill}
                      style={{ width: `${row.fillPercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Card>
  );
};

export default ProductPerformance;
