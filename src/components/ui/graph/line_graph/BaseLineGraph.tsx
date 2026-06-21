import type { CSSProperties } from "react";
import clsx from "clsx";
import {
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import style from "./LineGraph.module.css";

export interface LineGraphDatum {
  [key: string]: string | number;
}

export interface LineSeriesConfig {
  color: string;
  dataKey: string;
  name?: string;
  strokeDasharray?: string;
  strokeWidth?: number;
}

export interface BaseLineGraphProps {
  chartMargin?: {
    bottom?: number;
    left?: number;
    right?: number;
    top?: number;
  };
  className?: string;
  data: LineGraphDatum[];
  gridStroke?: string;
  height?: number | string;
  hideNumericAxis?: boolean;
  legendAlign?: "left" | "center" | "right";
  legendIconSize?: number;
  legendVerticalAlign?: "top" | "middle" | "bottom";
  legendWrapperStyle?: CSSProperties;
  lines: LineSeriesConfig[];
  showGrid?: boolean;
  showDots?: boolean;
  showLegend?: boolean;
  showValueLabels?: boolean;
  valueSuffix?: string;
  valueLabelFormatter?: (value: string | number | undefined) => string;
  xDataKey: string;
  xAxisPadding?: {
    left?: number;
    right?: number;
  };
  yAxisWidth?: number;
}

const BaseLineGraph: React.FC<BaseLineGraphProps> = ({
  chartMargin = { top: 8, right: 8, left: 0, bottom: 0 },
  className,
  data,
  gridStroke = "rgba(107, 99, 117, 0.18)",
  height = 320,
  hideNumericAxis = false,
  legendAlign = "right",
  legendIconSize = 14,
  legendVerticalAlign = "top",
  legendWrapperStyle,
  lines,
  showGrid = true,
  showDots = false,
  showLegend = true,
  showValueLabels = false,
  valueSuffix = "",
  valueLabelFormatter,
  xDataKey,
  xAxisPadding,
  yAxisWidth = 48,
}) => {
  const formatValue = (value: string | number | boolean | null | undefined) => {
    if (typeof value === "number") {
      return `${value}${valueSuffix}`;
    }

    if (typeof value === "string") {
      return value;
    }

    return "";
  };
  const formatLabelValue = (
    value: string | number | boolean | null | undefined,
  ) =>
    valueLabelFormatter &&
    (typeof value === "string" || typeof value === "number")
      ? valueLabelFormatter(value)
      : formatValue(value);

  return (
    <div className={clsx(style.root, className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={chartMargin}
        >
          {showGrid ? (
            <CartesianGrid
              horizontal
              stroke={gridStroke}
              strokeDasharray="4 4"
              vertical
            />
          ) : null}
          <XAxis
            axisLine={false}
            dataKey={xDataKey}
            padding={xAxisPadding}
            tick={{ fill: "var(--text)", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            hide={hideNumericAxis}
            tick={{ fill: "var(--text)", fontSize: 12 }}
            tickFormatter={formatValue}
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
              Array.isArray(value)
                ? value.join(" - ")
                : formatValue(
                    typeof value === "string" || typeof value === "number"
                      ? value
                      : undefined,
                  )
            }
            labelStyle={{ color: "var(--text-h)", fontWeight: 600 }}
          />
          {showLegend ? (
            <Legend
              align={legendAlign}
              iconType="circle"
              iconSize={legendIconSize}
              verticalAlign={legendVerticalAlign}
              wrapperStyle={{
                paddingBottom: legendVerticalAlign === "top" ? 16 : 0,
                ...legendWrapperStyle,
              }}
            />
          ) : null}
          {lines.map((line) => (
            <Line
              activeDot={{ r: 5 }}
              dataKey={line.dataKey}
              dot={
                showValueLabels || showDots
                  ? {
                      fill: line.color,
                      r: 4,
                      stroke: line.color,
                      strokeWidth: 0,
                    }
                  : false
              }
              key={line.dataKey}
              name={line.name ?? line.dataKey}
              stroke={line.color}
              strokeDasharray={line.strokeDasharray}
              strokeWidth={line.strokeWidth ?? 3}
              type="monotone"
            >
              {showValueLabels ? (
                <LabelList
                  dataKey={line.dataKey}
                  fill="var(--text)"
                  fontSize={12}
                  formatter={formatLabelValue}
                  offset={8}
                  position="top"
                />
              ) : null}
            </Line>
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BaseLineGraph;
