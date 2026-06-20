import Card from "../../../ui/card/Card";
import Table, { type TableColumn } from "../../../ui/table/Table";
import {
  promoCodePerformanceData,
  type PromoCodePerformanceDatum,
} from "../data";
import type { TrendSeriesKey } from "../QuotePerformance/types";
import type { AttritionComponentProps } from "../type";
import style from "./QuoteByPromoCode.module.css";

interface QuoteByPromoCodeProps extends AttritionComponentProps {
  activeTrendSeriesKey: TrendSeriesKey;
}

interface PromoCodeTableRow extends PromoCodePerformanceDatum {
  conversionRate: number;
  convertedShare: number;
  quotedShare: number;
}

const formatCount = (value: number) => value.toLocaleString();
const formatPercent = (value: number) => `${value}%`;
const formatDays = (value: number) => `${value}d`;

const QuoteByPromoCode: React.FC<QuoteByPromoCodeProps> = ({
  activeTrendSeriesKey,
  className,
}) => {
  const totalQuotedVolume = promoCodePerformanceData.reduce(
    (sum, row) => sum + row.quotedVolume,
    0,
  );
  const totalConvertedVolume = promoCodePerformanceData.reduce(
    (sum, row) => sum + row.convertedVolume,
    0,
  );
  const rows: PromoCodeTableRow[] = promoCodePerformanceData
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
      };
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
  const promoColumns: TableColumn<PromoCodeTableRow>[] = [
    {
      header: "Promo Code",
      isRowHeader: true,
      key: "promo-code",
      render: (row) => row.promoCode,
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
        <div className={style.header}>
          <div className="cardTitle">Quote by Promo Code</div>
          <span className={style.scopeLabel}>Top 10 Promo Codes</span>
        </div>

        <section className={style.panelBody}>
          <Table
            className={style.tableRegion}
            columns={promoColumns}
            layout="fixed"
            minWidth="100%"
            mobileMinWidth="56rem"
            rowKey={(row) => row.promoCode}
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
