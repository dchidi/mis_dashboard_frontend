import Card from "../../../ui/card/Card";
import SingleDonutChart, {
  type SingleDonutChartDatum,
  type SingleDonutChartTooltipProps,
} from "../../../ui/graph/donut_chart/SingleDonutChart";
import {
  premiumChannelSplitData,
  premiumCurrencyOptions,
  premiumOverviewData,
  type PremiumChannelSplitDatum,
  type PremiumCurrencyCode,
  type PremiumOverviewDatum,
} from "../data";
import type { AttritionComponentProps } from "../type";
import {
  formatCompactCurrency,
  formatPercent,
} from "../../../../utils/formatters";
import style from "./PremiumOverview.module.css";

interface PremiumChannelDonutDatum extends SingleDonutChartDatum {
  channel: PremiumChannelSplitDatum["channel"];
  contribution: number;
  fill: string;
  label: string;
  totalPremium: number;
  value: number;
}

interface PremiumOverviewProps extends AttritionComponentProps {
  activeCurrencyCode: PremiumCurrencyCode;
  channelSplitData?: PremiumChannelSplitDatum[];
  overviewData?: PremiumOverviewDatum;
}

const renderPremiumChannelTooltip =
  (currencyRate: number, currencySymbol: string, valueLabel: string) =>
  ({ active, payload }: SingleDonutChartTooltipProps) => {
    if (!active || !payload?.length) {
      return null;
    }

    const datum = payload[0].payload as PremiumChannelDonutDatum | undefined;
    if (!datum) {
      return null;
    }

    return (
      <div className={style.tooltip}>
        <div className={style.tooltipTitle}>{datum.channel}</div>
        <div className={style.tooltipRow}>
          <span>{valueLabel}</span>
          <strong>
            {formatCompactCurrency(datum.totalPremium * currencyRate, {
              currencySymbol,
            })}
          </strong>
        </div>
        <div className={style.tooltipRow}>
          <span>Contribution</span>
          <strong>{formatPercent(datum.contribution)}</strong>
        </div>
      </div>
    );
  };

const PremiumOverview: React.FC<PremiumOverviewProps> = ({
  activeCurrencyCode,
  channelSplitData = premiumChannelSplitData,
  className,
  overviewData = premiumOverviewData,
}) => {
  const activeCurrency =
    premiumCurrencyOptions.find((option) => option.code === activeCurrencyCode) ??
    premiumCurrencyOptions[0];
  const conversionFactor =
    overviewData.premiumQuotedGwp === 0
      ? 0
      : overviewData.premiumConverted / overviewData.premiumQuotedGwp;

  const quotedChannelChartData: PremiumChannelDonutDatum[] =
    channelSplitData.map((channel) => ({
      channel: channel.channel,
      contribution: channel.contribution,
      fill: channel.fill,
      label: `${channel.channel} Quoted Premium`,
      totalPremium: channel.totalPremium,
      value: channel.totalPremium,
    }));

  const convertedChannelChartData: PremiumChannelDonutDatum[] =
    channelSplitData.map((channel) => ({
      channel: channel.channel,
      contribution: channel.contribution,
      fill: channel.fill,
      label: `${channel.channel} Sales Premium`,
      totalPremium: channel.totalPremium * conversionFactor,
      value: channel.totalPremium * conversionFactor,
    }));

  const channelPanels = [
    {
      chartData: quotedChannelChartData,
      title: "Quoted Premium",
      totalValue: formatCompactCurrency(
        quotedChannelChartData.reduce((sum, entry) => sum + entry.totalPremium, 0) *
          activeCurrency.rate,
        { currencySymbol: activeCurrency.symbol },
      ),
      tooltipValueLabel: "Quoted Premium",
    },
    {
      chartData: convertedChannelChartData,
      title: "Sales Premium",
      totalValue: formatCompactCurrency(
        convertedChannelChartData.reduce(
          (sum, entry) => sum + entry.totalPremium,
          0,
        ) * activeCurrency.rate,
        { currencySymbol: activeCurrency.symbol },
      ),
      tooltipValueLabel: "Sales Premium",
    },
  ] as const;

  return (
    <Card className={className}>
      <div className={style.root}>
        <div className={style.header}>
          <div className={style.headerCopy}>
            <div className="cardTitle">Channel Distribution</div>
          </div>
        </div>

        <section className={style.mixSection}>
          <div className={style.panelStack}>
            {channelPanels.map((panel) => (
              <div className={style.channelPanel} key={panel.title}>
                <div className={style.panelHeader}>
                  <div className={style.panelTitleRow}>
                    <span className={`innerCardTitle ${style.panelTitle}`}>
                      {panel.title}
                    </span>
                  </div>
                </div>

                <div className={style.panelBody}>
                  <div className={style.chartShell}>
                    <SingleDonutChart
                      className={style.channelChart}
                      cornerRadius={10}
                      data={panel.chartData}
                      dataKey="value"
                      innerRadius="76%"
                      nameKey="label"
                      outerRadius="100%"
                      paddingAngle={3}
                      renderTooltip={renderPremiumChannelTooltip(
                        activeCurrency.rate,
                        activeCurrency.symbol,
                        panel.tooltipValueLabel,
                      )}
                      showTooltip
                    />
                    <div className={style.centerStat}>
                      <strong className={style.centerValue}>
                        {panel.totalValue}
                      </strong>
                    </div>
                  </div>

                  <div className={style.legend}>
                    {panel.chartData.map((channel) => {
                      const channelTotal = formatCompactCurrency(
                        channel.totalPremium * activeCurrency.rate,
                        { currencySymbol: activeCurrency.symbol },
                      );

                      return (
                        <div className={style.legendItem} key={channel.channel}>
                          <span
                            className={style.legendSwatch}
                            style={{ backgroundColor: channel.fill }}
                          />
                          <div className={style.legendText}>
                            <span className={style.legendName}>
                              {channel.channel}
                            </span>
                            <span className={style.legendMeta}>
                              {channelTotal}
                            </span>
                          </div>
                          <strong className={style.legendValue}>
                            {formatPercent(channel.contribution)}
                          </strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Card>
  );
};

export default PremiumOverview;
