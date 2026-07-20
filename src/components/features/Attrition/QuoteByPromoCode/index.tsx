import { useState, type CSSProperties } from "react";
import { RiDownloadCloud2Line } from "react-icons/ri";
import Card from "../../../ui/card/Card";
import Table, { type TableColumn } from "../../../ui/table/Table";
import SegmentedTabs from "../../../ui/segmented_tabs";
import {
  type PromoPerformanceTableRow,
  type QuoteByPromoCodeCardData,
} from "../data";
import type { MetricViewVariant } from "../metricView";
import type { TrendSeriesKey } from "../QuotePerformance/types";
import type { AttritionComponentProps } from "../type";
import style from "./QuoteByPromoCode.module.css";

interface QuoteByPromoCodeProps extends AttritionComponentProps {
  activeTrendSeriesKey: TrendSeriesKey;
  data?: QuoteByPromoCodeCardData;
  downloadDisabled?: boolean;
  isDownloadInProgress?: boolean;
  metricViewVariant?: MetricViewVariant;
  onDownload?: (view: "promoCode" | "agent") => void;
}

const accentRgb = "138, 116, 232";

type PromoPerformanceViewKey = "promoCode" | "agent";

const QuoteByPromoCode: React.FC<QuoteByPromoCodeProps> = ({
  activeTrendSeriesKey,
  className,
  data,
  downloadDisabled = false,
  isDownloadInProgress = false,
  metricViewVariant = "quote",
  onDownload,
}) => {
  const [activeTab, setActiveTab] = useState<PromoPerformanceViewKey>("promoCode");
  const primaryMetricLabel = metricViewVariant === "policy" ? "Policy" : "Quote";
  const promoTabs = [
    {
      key: "promoCode" as const,
      label: `${primaryMetricLabel} by Promo Code (Top 10)`,
    },
    {
      key: "agent" as const,
      label: `${primaryMetricLabel} by Agent (Top 10)`,
    },
  ];
  const activeView = data?.[activeTab]?.[activeTrendSeriesKey];

  if (!activeView) {
    return null;
  }

  const rootStyle = {
    "--accent-rgb": accentRgb,
  } as CSSProperties;
  const downloadTitle =
    activeTab === "promoCode"
      ? "Download full promo code data"
      : "Download full agent data";

  const promoColumns: TableColumn<PromoPerformanceTableRow>[] = [
    {
      header: "Country",
      key: "country-code",
      render: (row) => row.countryCode ?? "",
      width: "8%",
    },
    {
      header: activeView.firstColumnHeader,
      isRowHeader: true,
      key: "source-label",
      render: (row) => row.label,
      width: "16%",
    },
    {
      cellAlign: "right",
      header: `Total ${primaryMetricLabel}`,
      headerAlign: "right",
      key: "total-quote",
      render: (row) => row.quotedVolumeLabel,
      width: "10%",
    },
    {
      cellAlign: "right",
      header: `${primaryMetricLabel} Share`,
      headerAlign: "right",
      key: "quote-share",
      render: (row) => row.quotedShareLabel,
      width: "10%",
    },
    {
      cellAlign: "right",
      header: "Total Sales",
      headerAlign: "right",
      key: "total-sales",
      render: (row) => row.convertedVolumeLabel,
      width: "10%",
    },
    {
      cellAlign: "right",
      header: "Sales Share",
      headerAlign: "right",
      key: "sales-share",
      render: (row) => row.convertedShareLabel,
      width: "10%",
    },
    {
      cellAlign: "right",
      header: "Conversion %",
      headerAlign: "right",
      key: "conversion-rate",
      render: (row) => row.conversionRateLabel,
      width: "12%",
    },
    {
      cellAlign: "right",
      header: "Avg. Time to Convert",
      headerAlign: "right",
      key: "avg-time-to-convert",
      render: (row) => row.averageTimeToConvertLabel,
      width: "24%",
    },
  ];

  return (
    <Card className={className}>
      <div className={style.root} style={rootStyle}>
        <div className={style.header}>
          <div className="cardTitle">{activeView.title}</div>

          {onDownload ? (
            <div className={style.headerAside}>
              <button
                aria-label={
                  isDownloadInProgress
                    ? `${downloadTitle} in progress`
                    : downloadTitle
                }
                className={style.downloadButton}
                disabled={downloadDisabled || isDownloadInProgress}
                onClick={() => onDownload(activeTab)}
                title={downloadTitle}
                type="button"
              >
                <RiDownloadCloud2Line className={style.downloadButtonIcon} />
              </button>
            </div>
          ) : null}
        </div>

        <SegmentedTabs
          accentRgb={accentRgb}
          activeKey={activeTab}
          ariaLabel="Promo and agent views"
          idBase="promo-performance"
          onChange={(key) => setActiveTab(key as PromoPerformanceViewKey)}
          options={promoTabs}
        />

        <section className={style.panelBody}>
          <Table
            className={style.tableRegion}
            columns={promoColumns}
            layout="fixed"
            minWidth="100%"
            mobileMinWidth="56rem"
            rowKey={(row) => row.id}
            rows={activeView.rows}
            size="small"
            stickySpacerWidth="0.55rem"
          />
        </section>
      </div>
    </Card>
  );
};

export default QuoteByPromoCode;
