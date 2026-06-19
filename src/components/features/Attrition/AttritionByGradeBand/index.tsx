import Card from "../../../ui/card/Card";
import SingleBarGraph, {
  type SingleBarGraphTooltipProps,
} from "../../../ui/graph/bar_chart/SingleBarGraph";
import { gradeBandData, type AttritionGradeBandDatum } from "../data";
import type { AttritionComponentProps } from "../type";
import style from "./AttritionByGradeBand.module.css";

const renderGradeBandTooltip = ({
  active,
  label,
  payload,
}: SingleBarGraphTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const datum = payload[0].payload as AttritionGradeBandDatum | undefined;
  if (!datum) {
    return null;
  }

  return (
    <div className={style.tooltip}>
      <div className={style.tooltipTitle}>{label}</div>
      <div className={style.tooltipRow}>
        <span>Total Attrition</span>
        <strong>{datum.totalAttrition}</strong>
      </div>
      <div className={style.tooltipRow}>
        <span>Attrition Rate</span>
        <strong>{datum.rateLabel}</strong>
      </div>
    </div>
  );
};

const AttritionByGradeBand: React.FC<AttritionComponentProps> = ({
  className,
}) => {
  return (
    <Card className={className}>
      <div className={style.root}>
        <div className="cardTitle">Attrition by Grade/Band</div>
        <SingleBarGraph
          barSize={60}
          categoryKey="gradeBand"
          className={style.chart}
          color="#d97706"
          data={gradeBandData}
          labelKey="rateLabel"
          orientation="vertical"
          renderTooltip={renderGradeBandTooltip}
          showTooltip
          showValueLabels
          valueKey="attritionRate"
        />
      </div>
    </Card>
  );
};
export default AttritionByGradeBand;
