import clsx from "clsx";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import style from "./SingleBarGraph.module.css";

export interface SingleBarGraphDatum {
  [key: string]: string | number | undefined;
}

export interface SingleBarGraphTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{ payload?: SingleBarGraphDatum }>;
}

interface SingleBarGraphProps {
  barSize?: number;
  categoryKey: string;
  categoryWidth?: number;
  className?: string;
  color?: string;
  colorKey?: string;
  data: SingleBarGraphDatum[];
  gridStroke?: string;
  hideNumericAxis?: boolean;
  labelKey?: string;
  numericTickFormatter?: (value: number) => string | number;
  orientation?: "horizontal" | "vertical";
  renderTooltip?: (props: SingleBarGraphTooltipProps) => React.ReactNode;
  showTooltip?: boolean;
  showValueLabels?: boolean;
  valueKey: string;
}

const DefaultTooltip = ({
  active,
  label,
  payload,
}: SingleBarGraphTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const datum = payload[0].payload;
  if (!datum) {
    return null;
  }

  const valueKey = Object.keys(datum).find((key) => typeof datum[key] === "number");

  return (
    <div className={style.tooltip}>
      <div className={style.tooltipTitle}>{label}</div>
      {valueKey ? (
        <div className={style.tooltipRow}>
          <span>{valueKey}</span>
          <strong>{datum[valueKey]}</strong>
        </div>
      ) : null}
    </div>
  );
};

const SingleBarGraph: React.FC<SingleBarGraphProps> = ({
  barSize,
  categoryKey,
  categoryWidth,
  className,
  color = "#df4336",
  colorKey,
  data,
  gridStroke,
  hideNumericAxis = true,
  labelKey,
  numericTickFormatter,
  orientation = "vertical",
  renderTooltip,
  showTooltip = true,
  showValueLabels = false,
  valueKey,
}) => {
  const isHorizontal = orientation === "horizontal";

  return (
    <div
      className={clsx(style.root, className)}
      onMouseDown={(event) => event.preventDefault()}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          accessibilityLayer={false}
          data={data}
          layout={isHorizontal ? "vertical" : "horizontal"}
          margin={{
            top: 8,
            right: isHorizontal ? 28 : 12,
            left: isHorizontal ? 0 : 12,
            bottom: 8,
          }}
          onContextMenu={(_, event) => event.preventDefault()}
        >
          <CartesianGrid
            horizontal={!isHorizontal}
            stroke={gridStroke ?? "rgba(107, 99, 117, 0.08)"}
            strokeDasharray="4 4"
            vertical={isHorizontal && !hideNumericAxis}
          />

          {isHorizontal ? (
            <>
              <XAxis
                axisLine={false}
                hide={hideNumericAxis}
                tick={{ fill: "var(--text)", fontSize: 12 }}
                tickLine={false}
                tickFormatter={(value) =>
                  typeof value === "number" && numericTickFormatter
                    ? numericTickFormatter(value)
                    : value
                }
                type="number"
              />
              <YAxis
                axisLine={false}
                dataKey={categoryKey}
                tick={{ fill: "var(--text)", fontSize: 12 }}
                tickLine={false}
                type="category"
                width={categoryWidth ?? 88}
              />
            </>
          ) : (
            <>
              <XAxis
                axisLine={false}
                dataKey={categoryKey}
                tick={{ fill: "var(--text)", fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                hide={hideNumericAxis}
                tick={{ fill: "var(--text)", fontSize: 12 }}
                tickLine={false}
              />
            </>
          )}

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

          <Bar
            barSize={barSize ?? (isHorizontal ? 20 : 28)}
            dataKey={valueKey}
            fill={color}
            radius={isHorizontal ? [0, 8, 8, 0] : [8, 8, 0, 0]}
          >
            {colorKey
              ? data.map((entry, index) => {
                  const fill =
                    typeof entry[colorKey] === "string"
                      ? entry[colorKey]
                      : color;

                  return (
                    <Cell
                      fill={fill}
                      key={`${String(entry[categoryKey])}-${index}`}
                    />
                  );
                })
              : null}
            {showValueLabels && labelKey ? (
              <LabelList
                dataKey={labelKey}
                fill="var(--text-h)"
                fontSize={12}
                position={isHorizontal ? "right" : "top"}
              />
            ) : null}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SingleBarGraph;
