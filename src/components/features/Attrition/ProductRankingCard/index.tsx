import { type CSSProperties } from "react";
import Card from "../../../ui/card/Card";
import type { AttritionComponentProps } from "../type";
import style from "./ProductRankingCard.module.css";

export interface ProductRankingRow {
  metaDisplay: string;
  metricDisplay: string;
  metricValue: number;
  product: string;
}

interface ProductRankingCardProps extends AttritionComponentProps {
  accentRgb: string;
  rows: ProductRankingRow[];
  summaryLabel: string;
  summaryValue: string;
  title: string;
}

const ProductRankingCard: React.FC<ProductRankingCardProps> = ({
  accentRgb,
  className,
  rows,
  summaryLabel,
  summaryValue,
  title,
}) => {
  const maxValue = rows.reduce(
    (currentMax, row) => Math.max(currentMax, row.metricValue),
    0,
  );
  const rootStyle = {
    "--accent-rgb": accentRgb,
  } as CSSProperties;

  return (
    <Card className={className}>
      <div className={style.root} style={rootStyle}>
        <div className={style.header}>
          <div className="cardTitle">{title}</div>

          <div className={style.summary}>
            <span className={style.summaryLabel}>{summaryLabel}</span>
            <strong className={style.summaryValue}>{summaryValue}</strong>
          </div>
        </div>

        <div className={style.list}>
          {rows.map((row, index) => {
            const fillWidth =
              maxValue === 0 ? "0%" : `${(row.metricValue / maxValue) * 100}%`;

            return (
              <div
                className={style.row}
                key={row.product}
                title={`${row.product}: ${row.metricDisplay}`}
              >
                <div className={style.rowTop}>
                  <div className={style.identity}>
                    <span className={style.rank}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={style.productName}>{row.product}</span>
                  </div>

                  <div className={style.metricGroup}>
                    <span className={style.metricValue}>{row.metricDisplay}</span>
                    <span className={style.metricMeta}>{row.metaDisplay}</span>
                  </div>
                </div>

                <div className={style.track}>
                  <span className={style.fill} style={{ width: fillWidth }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default ProductRankingCard;
