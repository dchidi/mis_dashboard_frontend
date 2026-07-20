import { useState, type CSSProperties } from "react";
import { RiDownloadCloud2Line } from "react-icons/ri";
import Card from "../../../ui/card/Card";
import SegmentedTabs from "../../../ui/segmented_tabs";
import {
  type ProductMetricTabKey,
  type ProductPerformanceCardData,
} from "../data";
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

const productMetricTabs = [
  { key: "volume" as const, label: "Volume" },
  { key: "value" as const, label: "Value" },
];

const ProductPerformance: React.FC<ProductPerformanceProps> = ({
  activeTrendSeriesKey,
  className,
  data,
  downloadDisabled = false,
  isDownloadInProgress = false,
  onDownload,
}) => {
  const [activeTab, setActiveTab] = useState<ProductMetricTabKey>("volume");
  const activeView = data?.[activeTab]?.[activeTrendSeriesKey];

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
                    ? "Downloading product performance source data"
                    : "Download product performance source data"
                }
                className={style.downloadButton}
                disabled={downloadDisabled || isDownloadInProgress}
                onClick={onDownload}
                title="Download product performance source data"
                type="button"
              >
                <RiDownloadCloud2Line className={style.downloadButtonIcon} />
              </button>
            ) : null}
          </div>
        </div>

        <SegmentedTabs
          accentRgb={activeView.accentRgb}
          activeKey={activeTab}
          ariaLabel="Product ranking views"
          idBase="product-performance"
          onChange={(key) => setActiveTab(key as ProductMetricTabKey)}
          options={productMetricTabs}
        />

        <section
          aria-labelledby={`product-performance-tab-${activeTab}`}
          className={style.panelBody}
          id={`product-performance-panel-${activeTab}`}
          role="tabpanel"
        >
          <div className={style.panelContent}>
            <div className={style.list}>
              {activeView.rows.map((row) => (
                <div
                  className={style.row}
                  key={`${row.product}-${row.petType ?? ""}`}
                  title={`${row.product}${row.petType ? ` (${row.petType})` : ""}: ${row.metricDisplay}`}
                >
                  <div className={style.rowTop}>
                    <div className={style.identity}>
                      <span className={style.rank}>{row.rankLabel}</span>
                      <div className={style.identityText}>
                        <span className={style.productName}>{row.product}</span>
                        {row.petType ? (
                          <span className={style.petTypeTag}>{row.petType}</span>
                        ) : null}
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
