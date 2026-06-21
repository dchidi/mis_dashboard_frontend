import { useState } from "react";
import Card from "../../../ui/card/Card";
import Table, { type TableColumn } from "../../../ui/table/Table";
import SegmentedTabs from "../../../ui/segmented_tabs";
import {
  agentPerformanceData,
  promoCodePerformanceData,
  type AgentPerformanceDatum,
  type PromoCodePerformanceDatum,
} from "../data";
import type { TrendSeriesKey } from "../QuotePerformance/types";
import type { AttritionComponentProps } from "../type";
import style from "./QuoteByPromoCode.module.css";

interface QuoteByPromoCodeProps extends AttritionComponentProps {
  activeTrendSeriesKey: TrendSeriesKey;
  agentData?: AgentPerformanceDatum[];
  data?: PromoCodePerformanceDatum[];
}

type PromoCardTabKey = "promo-code" | "agent";

interface PerformanceSourceRow {
  conversionRate: number;
  convertedShare: number;
  id: string;
  label: string;
  quotedShare: number;
  averageTimeToConvertDays: number;
  convertedVolume: number;
  quotedVolume: number;
}

const formatCount = (value: number) => value.toLocaleString();
const formatPercent = (value: number) => `${value}%`;
const formatDays = (value: number) => `${value}d`;

const promoTabs = [
  {
    key: "promo-code" as const,
    label: "Quote by Promo Code (Top 10)",
  },
  {
    key: "agent" as const,
    label: "Quote by Agent (Top 10)",
  },
];

const QuoteByPromoCode: React.FC<QuoteByPromoCodeProps> = ({
  activeTrendSeriesKey,
  agentData = agentPerformanceData,
  className,
  data = promoCodePerformanceData,
}) => {
  const [activeTab, setActiveTab] = useState<PromoCardTabKey>("promo-code");
  const activeRowsSource =
    activeTab === "promo-code"
      ? data.map((row) => ({
          averageTimeToConvertDays: row.averageTimeToConvertDays,
          convertedVolume: row.convertedVolume,
          id: row.promoCode,
          label: row.promoCode,
          quotedVolume: row.quotedVolume,
        }))
      : agentData.map((row) => ({
          averageTimeToConvertDays: row.averageTimeToConvertDays,
          convertedVolume: row.convertedVolume,
          id: row.agent,
          label: row.agent,
          quotedVolume: row.quotedVolume,
        }));
  const totalQuotedVolume = activeRowsSource.reduce(
    (sum, row) => sum + row.quotedVolume,
    0,
  );
  const totalConvertedVolume = activeRowsSource.reduce(
    (sum, row) => sum + row.convertedVolume,
    0,
  );
  const rows: PerformanceSourceRow[] = activeRowsSource
    .map((row) => {
      const conversionRate = Number(
        ((row.convertedVolume / Math.max(row.quotedVolume, 1)) * 100).toFixed(1),
      );

      return {
        ...row,
        conversionRate,
        convertedShare: Number(
          ((row.convertedVolume / Math.max(totalConvertedVolume, 1)) * 100).toFixed(
            1,
          ),
        ),
        quotedShare: Number(
          ((row.quotedVolume / Math.max(totalQuotedVolume, 1)) * 100).toFixed(1),
        ),
      } satisfies PerformanceSourceRow;
    })
    .sort((left, right) => {
      if (activeTrendSeriesKey === "conversionRate") {
        return right.conversionRate - left.conversionRate;
      }

      if (activeTrendSeriesKey === "totalSales") {
        return right.convertedVolume - left.convertedVolume;
      }

      return right.quotedVolume - left.quotedVolume;
    })
    .slice(0, 10);
  const firstColumnHeader = activeTab === "promo-code" ? "Promo Code" : "Agent";
  const promoColumns: TableColumn<PerformanceSourceRow>[] = [
    {
      header: firstColumnHeader,
      isRowHeader: true,
      key: "source-label",
      render: (row) => row.label,
      width: "18%",
    },
    {
      cellAlign: "right",
      header: "Total Quote",
      headerAlign: "right",
      key: "total-quote",
      render: (row) => formatCount(row.quotedVolume),
      width: "12%",
    },
    {
      cellAlign: "right",
      header: "Quote Share",
      headerAlign: "right",
      key: "quote-share",
      render: (row) => formatPercent(row.quotedShare),
      width: "12%",
    },
    {
      cellAlign: "right",
      header: "Total Sales",
      headerAlign: "right",
      key: "total-sales",
      render: (row) => formatCount(row.convertedVolume),
      width: "12%",
    },
    {
      cellAlign: "right",
      header: "Sales Share",
      headerAlign: "right",
      key: "sales-share",
      render: (row) => formatPercent(row.convertedShare),
      width: "12%",
    },
    {
      cellAlign: "right",
      header: "Conversion %",
      headerAlign: "right",
      key: "conversion-rate",
      render: (row) => formatPercent(row.conversionRate),
      width: "12%",
    },
    {
      cellAlign: "right",
      header: "Avg. Time to Convert",
      headerAlign: "right",
      key: "avg-time-to-convert",
      render: (row) => formatDays(row.averageTimeToConvertDays),
      width: "22%",
    },
  ];

  return (
    <Card className={className}>
      <div className={style.root}>
        <div className="cardTitle">{promoTabs.find((tab) => tab.key === activeTab)?.label}</div>

        <SegmentedTabs
          accentRgb="138, 116, 232"
          activeKey={activeTab}
          ariaLabel="Promo and agent views"
          idBase="promo-performance"
          onChange={setActiveTab}
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
            rows={rows}
            size="small"
            stickySpacerWidth="0.55rem"
          />
        </section>
      </div>
    </Card>
  );
};

export default QuoteByPromoCode;
