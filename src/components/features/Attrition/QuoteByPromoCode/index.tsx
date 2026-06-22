import { useState } from "react";
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
  metricViewVariant?: MetricViewVariant;
}

const QuoteByPromoCode: React.FC<QuoteByPromoCodeProps> = ({
  activeTrendSeriesKey,
  className,
  data,
  metricViewVariant = "quote",
}) => {
  const [activeTab, setActiveTab] = useState<"promoCode" | "agent">("promoCode");
  const primaryMetricLabel =
    metricViewVariant === "policy" ? "Policy" : "Quote";
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

  const promoColumns: TableColumn<PromoPerformanceTableRow>[] = [
    {
      header: activeView.firstColumnHeader,
      isRowHeader: true,
      key: "source-label",
      render: (row) => row.label,
      width: "18%",
    },
    {
      cellAlign: "right",
      header: `Total ${primaryMetricLabel}`,
      headerAlign: "right",
      key: "total-quote",
      render: (row) => row.quotedVolumeLabel,
      width: "12%",
    },
    {
      cellAlign: "right",
      header: `${primaryMetricLabel} Share`,
      headerAlign: "right",
      key: "quote-share",
      render: (row) => row.quotedShareLabel,
      width: "12%",
    },
    {
      cellAlign: "right",
      header: "Total Sales",
      headerAlign: "right",
      key: "total-sales",
      render: (row) => row.convertedVolumeLabel,
      width: "12%",
    },
    {
      cellAlign: "right",
      header: "Sales Share",
      headerAlign: "right",
      key: "sales-share",
      render: (row) => row.convertedShareLabel,
      width: "12%",
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
      width: "22%",
    },
  ];

  return (
    <Card className={className}>
      <div className={style.root}>
        <div className="cardTitle">{activeView.title}</div>

        <SegmentedTabs
          accentRgb="138, 116, 232"
          activeKey={activeTab}
          ariaLabel="Promo and agent views"
          idBase="promo-performance"
          onChange={(key) => setActiveTab(key as "promoCode" | "agent")}
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
