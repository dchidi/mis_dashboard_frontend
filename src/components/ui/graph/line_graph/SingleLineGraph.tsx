import BaseLineGraph, {
  type LineGraphDatum,
  type LineSeriesConfig,
} from "./BaseLineGraph";

interface SingleLineGraphProps {
  className?: string;
  data: LineGraphDatum[];
  height?: number | string;
  line: LineSeriesConfig;
  showLegend?: boolean;
  valueSuffix?: string;
  xDataKey: string;
  yAxisWidth?: number;
}

const SingleLineGraph: React.FC<SingleLineGraphProps> = ({
  className,
  data,
  height,
  line,
  showLegend = false,
  valueSuffix,
  xDataKey,
  yAxisWidth,
}) => {
  return (
    <BaseLineGraph
      className={className}
      data={data}
      height={height}
      lines={[line]}
      showLegend={showLegend}
      valueSuffix={valueSuffix}
      xDataKey={xDataKey}
      yAxisWidth={yAxisWidth}
    />
  );
};

export default SingleLineGraph;
