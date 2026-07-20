import clsx from "clsx";
import { useId, type CSSProperties } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SingleAreaGraphDatum } from "./SingleAreaGraph";
import style from "./SingleAreaGraph.module.css";

interface ComparisonAreaGraphProps {
  allowYAxisDecimals?: boolean;
  axisTickFormatter?: (value: number) => string;
  chartMargin?: {
    bottom?: number;
    left?: number;
    right?: number;
    top?: number;
  };
  className?: string;
  comparisonColor?: string;
  comparisonDataKey: string;
  comparisonLabel?: string;
  comparisonStrokeDasharray?: string;
  data: SingleAreaGraphDatum[];
  currentColor?: string;
  currentDataKey: string;
  currentLabel?: string;
  legendAlign?: "left" | "center" | "right";
  legendIconSize?: number;
  legendVerticalAlign?: "top" | "middle" | "bottom";
  legendWrapperStyle?: CSSProperties;
  tooltipValueFormatter?: (value: number) => string;
  valueSuffix?: string;
  xAxisInterval?:
    | number
    | "preserveStart"
    | "preserveEnd"
    | "preserveStartEnd"
    | "equidistantPreserveStart";
  xAxisMinTickGap?: number;
  xAxisPadding?: {
    left?: number;
    right?: number;
  };
  xDataKey: string;
  yAxisWidth?: number;
}

const formatValue = (
  value: number | string | undefined,
  valueSuffix: string,
  tooltipValueFormatter?: (value: number) => string,
) => {
  if (typeof value === "number") {
    return tooltipValueFormatter ? tooltipValueFormatter(value) : `${value}${valueSuffix}`;
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
};

const ComparisonAreaGraph: React.FC<ComparisonAreaGraphProps> = ({
  allowYAxisDecimals = true,
  axisTickFormatter,
  chartMargin = { top: 8, right: 16, left: 10, bottom: 28 },
  className,
  comparisonColor = "#7f879f",
  comparisonDataKey,
  comparisonLabel = "Previous Year",
  comparisonStrokeDasharray = "6 5",
  data,
  currentColor = "#df4336",
  currentDataKey,
  currentLabel = "Current Year",
  legendAlign = "center",
  legendIconSize = 8,
  legendVerticalAlign = "bottom",
  legendWrapperStyle,
  tooltipValueFormatter,
  valueSuffix = "",
  xAxisInterval = "preserveStartEnd",
  xAxisMinTickGap = 24,
  xAxisPadding = { left: 10, right: 10 },
  xDataKey,
  yAxisWidth = 48,
}) => {
  const gradientId = useId().replace(/:/g, "");


  return (
    <div
      className={clsx(style.root, className)}
      onMouseDown={(event) => event.preventDefault()}
    >
      <ResponsiveContainer height="100%" width="100%">
        <ComposedChart
          accessibilityLayer={false}
          data={data}
          margin={chartMargin}
          onContextMenu={(_, event) => event.preventDefault()}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={currentColor} stopOpacity={0.22} />
              <stop offset="95%" stopColor={currentColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            horizontal
            stroke="rgba(107, 99, 117, 0.18)"
            strokeDasharray="4 4"
            vertical={false}
          />
          <XAxis
            axisLine={false}
            dataKey={xDataKey}
            interval={xAxisInterval}
            minTickGap={xAxisMinTickGap}
            padding={xAxisPadding}
            tick={{ fill: "var(--text)", fontSize: 12 }}
            tickMargin={10}
            tickLine={false}
          />
          <YAxis
            allowDecimals={allowYAxisDecimals}
            axisLine={false}
            tick={{ fill: "var(--text)", fontSize: 12 }}
            tickFormatter={(value) =>
              typeof value === "number"
                ? axisTickFormatter
                  ? axisTickFormatter(value)
                  : `${value}${valueSuffix}`
                : ""
            }
            tickLine={false}
            width={yAxisWidth}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              color: "var(--text-h)",
            }}
            formatter={(value) =>
              formatValue(
                typeof value === "number" || typeof value === "string"
                  ? value
                  : undefined,
                valueSuffix,
                tooltipValueFormatter,
              )
            }
            labelStyle={{ color: "var(--text-h)", fontWeight: 600 }}
          />
          <Legend
            align={legendAlign}
            iconSize={legendIconSize}
            iconType="circle"
            verticalAlign={legendVerticalAlign}
            wrapperStyle={legendWrapperStyle}
          />
          <Area
            activeDot={{
              r: 5,
              fill: "var(--border)",
              stroke: currentColor,
              strokeWidth: 2,
            }}
            dataKey={currentDataKey}
            dot={{
              r: 4,
              fill: "var(--border)",
              stroke: currentColor,
              strokeWidth: 2,
            }}
            fill={`url(#${gradientId})`}
            name={currentLabel}
            stroke={currentColor}
            strokeWidth={3.2}
            type="monotone"
          />
          <Line
            activeDot={{
              r: 4.5,
              fill: comparisonColor,
              stroke: comparisonColor,
              strokeWidth: 2,
            }}
            dataKey={comparisonDataKey}
            dot={{
              r: 3.5,
              fill: comparisonColor,
              stroke: comparisonColor,
              strokeWidth: 2,
            }}
            name={comparisonLabel}
            stroke={comparisonColor}
            strokeDasharray={comparisonStrokeDasharray}
            strokeWidth={2.1}
            type="monotone"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonAreaGraph;

