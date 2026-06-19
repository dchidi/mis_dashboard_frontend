import { useState } from "react";
import { FaRegLightbulb } from "react-icons/fa6";
import Card from "../../../ui/card/Card";
import SingleDonutChart, {
  type SingleDonutChartDatum,
  type SingleDonutChartTooltipProps,
} from "../../../ui/graph/donut_chart/SingleDonutChart";
import {
  genderAttritionData,
  predictorData,
  type AttritionGenderDatum,
} from "../data";
import type { AttritionComponentProps } from "../type";
import style from "./AttritionByGender.module.css";

interface GenderDonutDatum extends SingleDonutChartDatum {
  exits: number;
  fill: string;
  label: string;
  rate?: number;
  share: number;
  value: number;
}

const formatPercent = (value: number) => `${value}%`;
const formatPointGap = (value: number) => `${value.toFixed(1)} pts`;
const formatMultiplier = (value: number) => `${value.toFixed(1)}x`;
const formatExitEstimate = (value: number) => `${value.toFixed(1)} exits`;

const topPredictor = [...predictorData].sort(
  (left, right) => right.attritionRate - left.attritionRate,
)[0];
const reviewPredictor =
  predictorData.find(
    (predictor) => predictor.predictor === "No salary review in 12 months",
  ) ?? topPredictor;

const renderGenderTooltip = ({
  active,
  payload,
}: SingleDonutChartTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const datum = payload[0].payload as GenderDonutDatum | undefined;
  if (!datum) {
    return null;
  }

  return (
    <div className={style.tooltip}>
      <div className={style.tooltipTitle}>{datum.label}</div>
      <div className={style.tooltipRow}>
        <span>Exits</span>
        <strong>{datum.exits}</strong>
      </div>
      <div className={style.tooltipRow}>
        <span>Share of Attrition</span>
        <strong>{formatPercent(datum.share)}</strong>
      </div>
      {datum.rate !== undefined ? (
        <div className={style.tooltipRow}>
          <span>Attrition Rate</span>
          <strong>{formatPercent(datum.rate)}</strong>
        </div>
      ) : null}
    </div>
  );
};

const buildInsights = (
  current: AttritionGenderDatum,
  other: AttritionGenderDatum,
) => {
  const rateGap = Math.abs(current.attritionRate - other.attritionRate);
  const representationGap = Number(
    Math.abs(current.shareOfTotalAttrition - current.shareOfHeadcount).toFixed(
      1,
    ),
  );
  const representationDirection =
    current.shareOfTotalAttrition >= current.shareOfHeadcount
      ? "above"
      : "below";

  if (current.key === "male") {
    const predictorGap = topPredictor.attritionRate - current.attritionRate;
    const predictorLift = topPredictor.attritionRate / current.attritionRate;
    const matchedExitCount = (other.attritionRate / 100) * current.headcount;

    return [
      `${current.gender} employees make up ${formatPercent(
        current.shareOfHeadcount,
      )} of headcount but ${formatPercent(
        current.shareOfTotalAttrition,
      )} of exits, so exits are ${formatPointGap(
        representationGap,
      )} ${representationDirection} workforce representation.`,
      `If male attrition tracked the female rate of ${formatPercent(
        other.attritionRate,
      )}, expected male exits would be about ${formatExitEstimate(
        matchedExitCount,
      )} instead of ${current.exits}.`,
      `${topPredictor.predictor} is the strongest workforce risk pocket at ${formatPercent(
        topPredictor.attritionRate,
      )}, which is ${formatPointGap(
        predictorGap,
      )} above the male baseline and ${formatMultiplier(
        predictorLift,
      )} as high.`,
    ];
  }

  const headcountGap = other.headcount - current.headcount;
  const reviewLift = reviewPredictor.attritionRate / current.attritionRate;
  const matchedExitCount = (other.attritionRate / 100) * current.headcount;

  return [
    `${current.gender} employees represent ${formatPercent(
      current.shareOfHeadcount,
    )} of headcount but ${formatPercent(
      current.shareOfTotalAttrition,
    )} of exits, placing exit share ${formatPointGap(
      representationGap,
    )} ${representationDirection} workforce representation.`,
    `Female headcount is ${headcountGap} lower than male, yet the attrition-rate gap is only ${formatPointGap(
      rateGap,
    )}. At the male rate, expected female exits would be about ${formatExitEstimate(
      matchedExitCount,
    )}.`,
    `${reviewPredictor.predictor} is running at ${formatPercent(
      reviewPredictor.attritionRate,
    )}, or ${formatMultiplier(reviewLift)} the female baseline.`,
  ];
};

const AttritionByGender: React.FC<AttritionComponentProps> = ({
  className,
}) => {
  const [activeInsightKey, setActiveInsightKey] = useState<
    AttritionGenderDatum["key"] | null
  >(null);
  const activeGroup =
    genderAttritionData.find((group) => group.key === activeInsightKey) ?? null;
  const comparisonGroup = activeGroup
    ? (genderAttritionData.find((group) => group.key !== activeGroup.key) ??
        null)
    : null;
  const activeInsights =
    activeGroup && comparisonGroup
      ? buildInsights(activeGroup, comparisonGroup)
      : [];

  return (
    <Card className={className}>
      <div className={style.root}>
        <div className="cardTitle">Attrition by Gender</div>
        <p className={style.subtitle}>
          Each donut shows contribution to total exits by gender.
        </p>

        <div className={style.stack}>
          {genderAttritionData.map((group) => {
            const otherGroup = genderAttritionData.find(
              (item) => item.key !== group.key,
            ) as AttritionGenderDatum;
            const chartData: GenderDonutDatum[] = [
              {
                label: `${group.gender} Attrition`,
                exits: group.exits,
                fill: group.color,
                rate: group.attritionRate,
                share: group.shareOfTotalAttrition,
                value: group.exits,
              },
              {
                label: `${otherGroup.gender} Attrition`,
                exits: otherGroup.exits,
                fill: "rgba(107, 99, 117, 0.24)",
                share: otherGroup.shareOfTotalAttrition,
                value: otherGroup.exits,
              },
            ];

            return (
              <section
                className={`${style.panel} ${
                  group.key === "male" ? style.panelMale : style.panelFemale
                }`}
                key={group.key}
              >
                <div className={style.panelHeader}>
                  <div className={style.panelTitleRow}>
                    <span
                      className={style.panelDot}
                      style={{ backgroundColor: group.color }}
                    />
                    <span className={style.panelTitle}>{group.gender}</span>
                  </div>
                  <button
                    aria-label={`View ${group.gender.toLowerCase()} attrition insights`}
                    className={style.insightButton}
                    onClick={() => setActiveInsightKey(group.key)}
                    title="View insights"
                    type="button"
                  >
                    <FaRegLightbulb aria-hidden="true" />
                  </button>
                </div>

                <div className={style.chartRow}>
                  <div className={style.chartShell}>
                    <SingleDonutChart
                      className={style.chart}
                      cornerRadius={10}
                      data={chartData}
                      dataKey="value"
                      innerRadius="76%"
                      nameKey="label"
                      outerRadius="100%"
                      paddingAngle={3}
                      renderTooltip={renderGenderTooltip}
                      showTooltip
                    />
                    <div className={style.centerStat}>
                      <strong className={style.centerValue}>
                        {formatPercent(group.shareOfTotalAttrition)}
                      </strong>
                      <span className={style.centerLabel}>share of exits</span>
                    </div>
                  </div>

                  <div className={style.metrics}>
                    <div className={style.metricRow}>
                      <span className={style.metricKey}>Attrition Rate</span>
                      <strong className={style.metricValue}>
                        {formatPercent(group.attritionRate)}
                      </strong>
                    </div>
                    <div className={style.metricRow}>
                      <span className={style.metricKey}>Exits</span>
                      <strong className={style.metricValue}>
                        {group.exits}
                      </strong>
                    </div>
                    <div className={style.metricRow}>
                      <span className={style.metricKey}>Headcount</span>
                      <strong className={style.metricValue}>
                        {group.headcount}
                      </strong>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {activeGroup && comparisonGroup ? (
          <div
            aria-modal="true"
            className={style.modalOverlay}
            onClick={() => setActiveInsightKey(null)}
            role="dialog"
          >
            <div
              className={style.modal}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={style.modalHeader}>
                <div>
                  <div className={style.modalEyebrow}>Gender Insights</div>
                  <h3 className={style.modalTitle}>{activeGroup.gender}</h3>
                </div>
                <button
                  className={style.closeButton}
                  onClick={() => setActiveInsightKey(null)}
                  type="button"
                >
                  Close
                </button>
              </div>

              <div className={style.modalSummary}>
                <span>
                  {formatPercent(activeGroup.attritionRate)} attrition rate
                </span>
                <span>{activeGroup.exits} exits</span>
                <span>
                  {formatPercent(activeGroup.shareOfTotalAttrition)} of total
                  exits
                </span>
              </div>

              <div className={style.insightList}>
                {activeInsights.map((insight) => (
                  <div className={style.insightItem} key={insight}>
                    <span className={style.insightBullet} />
                    <p className={style.insightText}>{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
};

export default AttritionByGender;
