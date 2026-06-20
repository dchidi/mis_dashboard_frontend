import { useEffect, useRef, useState } from "react";
import { FaChevronDown } from "react-icons/fa6";
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

const PremiumOverview: React.FC<AttritionComponentProps> = ({ className }) => {
  const [activeCurrencyCode, setActiveCurrencyCode] =
    useState<PremiumCurrencyCode>("GBP");
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const currencyControlRef = useRef<HTMLDivElement | null>(null);
  const activeCurrency =
    premiumCurrencyOptions.find((option) => option.code === activeCurrencyCode) ??
    premiumCurrencyOptions[0];
  const conversionFactor =
    premiumOverviewData.premiumQuotedGwp === 0
      ? 0
      : premiumOverviewData.premiumConverted / premiumOverviewData.premiumQuotedGwp;

  const quotedChannelChartData: PremiumChannelDonutDatum[] =
    premiumChannelSplitData.map((channel) => ({
      channel: channel.channel,
      contribution: channel.contribution,
      fill: channel.fill,
      label: `${channel.channel} Quoted Premium`,
      totalPremium: channel.totalPremium,
      value: channel.totalPremium,
    }));

  const convertedChannelChartData: PremiumChannelDonutDatum[] =
    premiumChannelSplitData.map((channel) => ({
      channel: channel.channel,
      contribution: channel.contribution,
      fill: channel.fill,
      label: `${channel.channel} Converted Premium`,
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
      title: "Converted Premium",
      totalValue: formatCompactCurrency(
        convertedChannelChartData.reduce(
          (sum, entry) => sum + entry.totalPremium,
          0,
        ) * activeCurrency.rate,
        { currencySymbol: activeCurrency.symbol },
      ),
      tooltipValueLabel: "Converted Premium",
    },
  ] as const;

  useEffect(() => {
    if (!isCurrencyMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!currencyControlRef.current?.contains(event.target as Node)) {
        setIsCurrencyMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCurrencyMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCurrencyMenuOpen]);

  return (
    <Card className={className}>
      <div className={style.root}>
        <div className={style.header}>
          <div className={style.headerCopy}>
            <div className="cardTitle">Channel Distribution</div>
          </div>

          <div className={style.currencyControl} ref={currencyControlRef}>
            <button
              aria-expanded={isCurrencyMenuOpen}
              aria-haspopup="listbox"
              className={style.currencyTrigger}
              onClick={() => setIsCurrencyMenuOpen((current) => !current)}
              type="button"
            >
              <span>{activeCurrency.label}</span>
              <FaChevronDown
                aria-hidden="true"
                className={`${style.currencyTriggerIcon} ${
                  isCurrencyMenuOpen ? style.currencyTriggerIconOpen : ""
                }`}
              />
            </button>

            {isCurrencyMenuOpen ? (
              <div
                aria-label="Currency options"
                className={style.currencyMenu}
                role="listbox"
              >
                {premiumCurrencyOptions.map((option) => {
                  const isActive = option.code === activeCurrency.code;

                  return (
                    <button
                      aria-selected={isActive}
                      className={`${style.currencyOption} ${
                        isActive ? style.currencyOptionActive : ""
                      }`}
                      key={option.code}
                      onClick={() => {
                        setActiveCurrencyCode(option.code);
                        setIsCurrencyMenuOpen(false);
                      }}
                      role="option"
                      type="button"
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
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
