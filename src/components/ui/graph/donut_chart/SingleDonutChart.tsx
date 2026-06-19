import clsx from "clsx";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import style from "./SingleDonutChart.module.css";

export interface SingleDonutChartDatum {
  [key: string]: string | number | undefined;
}

export interface SingleDonutChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{
    name?: string | number;
    payload?: SingleDonutChartDatum;
    value?: unknown;
  }>;
}

interface SingleDonutChartProps {
  className?: string;
  colorKey?: string;
  cornerRadius?: number;
  data: SingleDonutChartDatum[];
  dataKey: string;
  innerRadius?: number | string;
  nameKey: string;
  outerRadius?: number | string;
  paddingAngle?: number;
  renderTooltip?: (props: SingleDonutChartTooltipProps) => React.ReactNode;
  showTooltip?: boolean;
}

const palette = ["#df4336", "#f97316", "#fb7185", "#f59e0b", "#ef4444"];

const DefaultTooltip = ({
  active,
  payload,
}: SingleDonutChartTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const entry = payload[0];
  const displayValue = Array.isArray(entry.value)
    ? entry.value.join(" - ")
    : String(entry.value ?? "");

  return (
    <div className={style.tooltip}>
      <div className={style.tooltipTitle}>{entry.name}</div>
      <div className={style.tooltipRow}>
        <span>Value</span>
        <strong>{displayValue}</strong>
      </div>
    </div>
  );
};

const SingleDonutChart: React.FC<SingleDonutChartProps> = ({
  className,
  colorKey = "fill",
  cornerRadius = 12,
  data,
  dataKey,
  innerRadius = "74%",
  nameKey,
  outerRadius = "100%",
  paddingAngle = 4,
  renderTooltip,
  showTooltip = true,
}) => {
  return (
    <div
      className={clsx(style.root, className)}
      onMouseDown={(event) => event.preventDefault()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart accessibilityLayer={false}>
          {showTooltip ? (
            <Tooltip
              content={(tooltipProps) =>
                renderTooltip ? (
                  <>{renderTooltip(tooltipProps)}</>
                ) : (
                  <DefaultTooltip {...tooltipProps} />
                )
              }
              cursor={false}
              trigger="hover"
            />
          ) : null}
          <Pie
            cornerRadius={cornerRadius}
            data={data}
            dataKey={dataKey}
            innerRadius={innerRadius}
            nameKey={nameKey}
            outerRadius={outerRadius}
            paddingAngle={paddingAngle}
            stroke="none"
          >
            {data.map((entry, index) => {
              const fill =
                typeof entry[colorKey] === "string"
                  ? entry[colorKey]
                  : palette[index % palette.length];

              return <Cell fill={fill} key={`${String(entry[nameKey])}-${index}`} />;
            })}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SingleDonutChart;
