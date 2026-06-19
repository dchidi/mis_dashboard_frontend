import clsx from "clsx";
import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import style from "./SingleAreaGraph.module.css";

export interface SingleAreaGraphDatum {
  [key: string]: string | number | undefined;
}

export interface SingleAreaGraphTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{ payload?: SingleAreaGraphDatum }>;
}

interface SingleAreaGraphProps {
  className?: string;
  color?: string;
  data: SingleAreaGraphDatum[];
  renderTooltip?: (props: SingleAreaGraphTooltipProps) => React.ReactNode;
  showTooltip?: boolean;
  showValueLabels?: boolean;
  valueLabelColor?: string;
  valueLabelFormatter?: (
    value: string | number | undefined,
  ) => string | number | undefined;
  xDataKey: string;
  yDataKey: string;
}

const formatValue = (value: string | number | undefined) => {
  if (typeof value === "number") {
    return value;
  }

  return value ?? "";
};

const DefaultTooltip = ({
  active,
  label,
  payload,
  yDataKey,
}: SingleAreaGraphTooltipProps & { yDataKey: string }) => {
  if (!active || !payload?.length) {
    return null;
  }

  const datum = payload[0].payload;
  if (!datum) {
    return null;
  }

  return (
    <div className={style.tooltip}>
      <div className={style.tooltipTitle}>{label}</div>
      <div className={style.tooltipRow}>
        <span>{yDataKey}</span>
        <strong>{formatValue(datum[yDataKey])}</strong>
      </div>
    </div>
  );
};

const SingleAreaGraph: React.FC<SingleAreaGraphProps> = ({
  className,
  color = "#df4336",
  data,
  renderTooltip,
  showTooltip = true,
  showValueLabels = false,
  valueLabelColor,
  valueLabelFormatter,
  xDataKey,
  yDataKey,
}) => {
  const gradientId = useId().replace(/:/g, "");

  return (
    <div
      className={clsx(style.root, className)}
      onMouseDown={(event) => event.preventDefault()}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          accessibilityLayer={false}
          data={data}
          margin={{
            top: showValueLabels ? 24 : 8,
            right: 20,
            left: 20,
            bottom: 8,
          }}
          onContextMenu={(_, event) => event.preventDefault()}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.18} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="rgba(107, 99, 117, 0.08)"
            strokeDasharray="4 4"
            vertical={false}
          />
          <XAxis
            axisLine={false}
            dataKey={xDataKey}
            interval={0}
            padding={{ left: 4, right: 4 }}
            tick={{ fill: "var(--text)", fontSize: 12 }}
            tickMargin={10}
            tickLine={false}
          />
          {showTooltip ? (
            <Tooltip
              content={(tooltipProps) =>
                renderTooltip ? (
                  <>{renderTooltip(tooltipProps)}</>
                ) : (
                  <DefaultTooltip {...tooltipProps} yDataKey={yDataKey} />
                )
              }
              cursor={false}
              trigger="hover"
            />
          ) : null}
          <Area
            type="monotone"
            dataKey={yDataKey}
            dot={{
              r: 4,
              fill: "var(--border)",
              stroke: color,
              strokeWidth: 2,
            }}
            fill={`url(#${gradientId})`}
            activeDot={{
              r: 5,
              fill: "var(--border)",
              stroke: color,
              strokeWidth: 2,
            }}
            stroke={color}
            strokeWidth={4}
          >
            {showValueLabels ? (
              <LabelList
                dataKey={yDataKey}
                fill={valueLabelColor ?? color}
                fontSize={12}
                formatter={(value) =>
                  valueLabelFormatter
                    ? (valueLabelFormatter(
                        typeof value === "string" || typeof value === "number"
                          ? value
                          : undefined,
                      ) ?? "")
                    : formatValue(
                        typeof value === "string" || typeof value === "number"
                          ? value
                          : undefined,
                      )
                }
                offset={10}
                position="top"
              />
            ) : null}
          </Area>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SingleAreaGraph;
