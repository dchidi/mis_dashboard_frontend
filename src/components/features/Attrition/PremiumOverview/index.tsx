import type { CSSProperties } from "react";
import Card from "../../../ui/card/Card";
import Table, { type TableColumn } from "../../../ui/table/Table";
import {
  type MetricDisplayRow,
  type PremiumOverviewCardData,
} from "../data";
import type { AttritionComponentProps } from "../type";
import style from "./PremiumOverview.module.css";

interface PremiumOverviewProps extends AttritionComponentProps {
  data?: PremiumOverviewCardData;
}

const channelMetricColumns: TableColumn<MetricDisplayRow>[] = [
  {
    header: "Metric",
    isRowHeader: true,
    key: "metric",
    render: (row) => row.label,
    width: "68%",
  },
  {
    cellAlign: "right",
    header: "Value",
    headerAlign: "right",
    key: "value",
    render: (row) => <span className={style.metricTableValue}>{row.value}</span>,
    width: "32%",
  },
];

const DonutChart: React.FC<{
  accentColor: string;
  share: number;
}> = ({ accentColor, share }) => (
  <div className={style.gaugeWrap}>
    <svg aria-hidden="true" className={style.gauge} viewBox="0 0 220 220">
      <circle
        className={style.gaugeTrack}
        cx="110"
        cy="110"
        fill="none"
        pathLength={100}
        r="72"
      />
      <circle
        className={style.gaugeFill}
        cx="110"
        cy="110"
        fill="none"
        pathLength={100}
        r="72"
        stroke={accentColor}
        strokeDasharray={`${share} 100`}
      />
    </svg>

    <div className={style.gaugeCenter}>
      <strong className={style.gaugeValue}>{share}%</strong>
      <span className={style.gaugeLabel}>Share of Total</span>
    </div>
  </div>
);

const PremiumOverview: React.FC<PremiumOverviewProps> = ({
  className,
  data,
}) => {
  if (!data?.sections.length) {
    return null;
  }

  return (
    <Card className={className}>
      <div className={style.root}>
        <div className={style.header}>
          <div className={style.headerCopy}>
            <div className="cardTitle">Channel Distribution</div>
          </div>
        </div>

        <section className={style.panelStack}>
          {data.sections.map((section) => (
            <article
              className={style.channelSection}
              key={section.channel}
              style={
                {
                  "--channel-accent": section.accentColor,
                  "--channel-glow-rgb": section.accentGlowRgb,
                } as CSSProperties
              }
            >
              <div className={style.channelSectionInner}>
                <div className={style.channelTitleRow}>
                  <span className={style.channelDot} />
                  <span className={`innerCardTitle ${style.channelTitle}`}>
                    {section.channel}
                  </span>
                </div>

                <DonutChart
                  accentColor={section.accentColor}
                  share={section.share}
                />

                <Table
                  className={style.metricsTable}
                  columns={channelMetricColumns}
                  layout="fixed"
                  minWidth="100%"
                  mobileMinWidth="100%"
                  rowKey={(row) => row.id}
                  rows={section.metricRows}
                  size="small"
                  stickySpacerWidth="0.4rem"
                />
              </div>
            </article>
          ))}
        </section>
      </div>
    </Card>
  );
};

export default PremiumOverview;
