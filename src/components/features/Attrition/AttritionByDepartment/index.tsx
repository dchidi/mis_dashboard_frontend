import Card from "../../../ui/card/Card";
import SingleDonutChart, {
  type SingleDonutChartDatum,
  type SingleDonutChartTooltipProps,
} from "../../../ui/graph/donut_chart/SingleDonutChart";
import {
  departmentData,
  departmentTotalAttrition,
  type AttritionDepartmentDatum,
} from "../data";
import type { AttritionComponentProps } from "../type";
import style from "./AttritionByDepartment.module.css";

const renderDepartmentTooltip = ({
  active,
  payload,
}: SingleDonutChartTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const datum = payload[0].payload as
    | (AttritionDepartmentDatum & SingleDonutChartDatum)
    | undefined;
  if (!datum) {
    return null;
  }

  const share = Math.round(
    (datum.totalAttrition / departmentTotalAttrition) * 100,
  );

  return (
    <div className={style.tooltip}>
      <div className={style.tooltipTitle}>{datum.department}</div>
      <div className={style.tooltipRow}>
        <span>Total Attrition</span>
        <strong>{datum.totalAttrition}</strong>
      </div>
      <div className={style.tooltipRow}>
        <span>Share</span>
        <strong>{share}%</strong>
      </div>
      <div className={style.tooltipRow}>
        <span>Attrition Rate</span>
        <strong>{datum.attritionRate}%</strong>
      </div>
    </div>
  );
};

const AttritionByDepartment: React.FC<AttritionComponentProps> = ({
  className,
}) => {
  return (
    <Card className={className}>
      <div className={style.root}>
        <div className="cardTitle">Attrition by Department</div>

        <div className={style.chartShell}>
          <SingleDonutChart
            className={style.chart}
            data={departmentData}
            dataKey="totalAttrition"
            innerRadius="72%"
            nameKey="department"
            outerRadius="100%"
            paddingAngle={5}
            renderTooltip={renderDepartmentTooltip}
            showTooltip
          />
          <div className={style.centerStat}>
            <span className={style.centerLabel}>Total</span>
            <strong className={style.centerValue}>
              {departmentTotalAttrition}
            </strong>
          </div>
        </div>

        <div className={style.legend}>
          {departmentData.map((department) => (
            <div className={style.legendItem} key={department.department}>
              <div className={style.legendText}>
                <div className={style.legendHeader}>
                  <span
                    className={style.legendSwatch}
                    style={{ backgroundColor: department.fill }}
                  />
                  <span className={style.legendName}>
                    {department.department}
                  </span>
                </div>
                <span className={style.legendMeta}>
                  {department.totalAttrition} | {department.attritionRate}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
export default AttritionByDepartment;
