import Card from "../../../ui/card/Card";
import {
  currentPeriodSummary,
  summaryAttritionRate,
  summaryRetentionRate,
} from "../data";
import type { AttritionComponentProps } from "../type";
import style from "./AttritionSummary.module.css";

const formatPercent = (value: number) => `${value}%`;

const AttritionSummary: React.FC<AttritionComponentProps> = ({ className }) => {
  return (
    <Card className={className}>
      <div className={style.root}>
        <div className={style.header}>
          <div className={style.headerCopy}>
            <div className="cardTitle">Attrition Snapshot</div>
            <p className={style.subtitle}>
              Overall workforce movement for the active reporting window.
            </p>
          </div>
          <span className={style.periodBadge}>{currentPeriodSummary.label}</span>
        </div>

        <div className={style.metricGrid}>
          <section className={`${style.metricCard} ${style.metricRisk}`}>
            <div className={style.metricLabel}>Total Attrition Rate</div>
            <div className={style.metricValueRow}>
              <strong className={style.metricValue}>
                {formatPercent(summaryAttritionRate)}
              </strong>
              <span className={style.metricHint}>overall</span>
            </div>
            <p className={style.metricCopy}>
              {currentPeriodSummary.exits} exits against an average headcount
              of {currentPeriodSummary.averageHeadcount} employees.
            </p>
          </section>

          <section className={`${style.metricCard} ${style.metricStable}`}>
            <div className={style.metricLabel}>Retention Rate</div>
            <div className={style.metricValueRow}>
              <strong className={style.metricValue}>
                {formatPercent(summaryRetentionRate)}
              </strong>
            </div>
            <p className={style.metricCopy}>
              Measured against the same current-period workforce base.
            </p>
          </section>
        </div>

        <div className={style.balanceBlock}>
          <div className={style.balanceHeader}>
            <span className={style.balanceTitle}>Workforce Mix</span>
            <span className={style.balanceMeta}>Lost vs retained base</span>
          </div>

          <div className={style.balanceBar} aria-hidden="true">
            <div
              className={style.balanceLost}
              style={{ width: `${summaryAttritionRate}%` }}
            />
            <div
              className={style.balanceRetained}
              style={{ width: `${summaryRetentionRate}%` }}
            />
          </div>

          <div className={style.balanceLegend}>
            <div className={style.legendItem}>
              <span className={`${style.legendDot} ${style.legendDotRisk}`} />
              <span className={style.legendLabel}>Attrited</span>
              <strong className={style.legendValue}>
                {formatPercent(summaryAttritionRate)}
              </strong>
            </div>
            <div className={style.legendItem}>
              <span className={`${style.legendDot} ${style.legendDotStable}`} />
              <span className={style.legendLabel}>Retained</span>
              <strong className={style.legendValue}>
                {formatPercent(summaryRetentionRate)}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AttritionSummary;
