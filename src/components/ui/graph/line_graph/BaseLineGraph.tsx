import clsx from "clsx";
import {
  CartesianGrid,
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
  className?: string;
  data: LineGraphDatum[];
  gridStroke?: string;
  height?: number | string;
  lines: LineSeriesConfig[];
  showGrid?: boolean;
  showLegend?: boolean;
  valueSuffix?: string;
  xDataKey: string;
  yAxisWidth?: number;
}

const BaseLineGraph: React.FC<BaseLineGraphProps> = ({
  className,
  data,
  gridStroke = "rgba(107, 99, 117, 0.18)",
  height = 320,
  lines,
  showGrid = true,
  showLegend = true,
  valueSuffix = "",
  xDataKey,
  yAxisWidth = 48,
}) => {
  const formatValue = (value: string | number | undefined) => {
    if (typeof value === "number") {
      return `${value}${valueSuffix}`;
    }

    return value ?? "";
  };

  return (
    <div className={clsx(style.root, className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
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
            tick={{ fill: "var(--text)", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
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
              align="right"
              iconType="circle"
              verticalAlign="top"
              wrapperStyle={{ paddingBottom: 16 }}
            />
          ) : null}
          {lines.map((line) => (
            <Line
              activeDot={{ r: 5 }}
              dataKey={line.dataKey}
              dot={false}
              key={line.dataKey}
              name={line.name ?? line.dataKey}
              stroke={line.color}
              strokeDasharray={line.strokeDasharray}
              strokeWidth={line.strokeWidth ?? 3}
              type="monotone"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BaseLineGraph;
