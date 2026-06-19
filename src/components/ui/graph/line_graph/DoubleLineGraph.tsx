import BaseLineGraph, {
  type BaseLineGraphProps,
  type LineGraphDatum,
  type LineSeriesConfig,
} from "./BaseLineGraph";
import {
  attritionTrendSampleData,
  attritionTrendSampleLines,
} from "./sampleData";

export type { LineGraphDatum, LineSeriesConfig };

export interface DoubleLineGraphProps
  extends Omit<BaseLineGraphProps, "data" | "lines" | "xDataKey"> {
  data?: LineGraphDatum[];
  lines?: [LineSeriesConfig, LineSeriesConfig, ...LineSeriesConfig[]];
  xDataKey?: string;
}

const DoubleLineGraph: React.FC<DoubleLineGraphProps> = ({
  data = attritionTrendSampleData,
  lines = attritionTrendSampleLines,
  xDataKey = "month",
  ...props
}) => {
  return (
    <BaseLineGraph
      {...props}
      data={data}
      lines={lines}
      xDataKey={xDataKey}
    />
  );
};

export default DoubleLineGraph;
