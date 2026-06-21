import type { CSSProperties } from "react";
import Card from "../../../ui/card/Card";
import {
  premiumChannelSplitData,
  pendingQuoteByCountryData,
  trendData,
  type PendingQuoteByCountryDatum,
  type PremiumChannelSplitDatum,
  type PremiumCurrencyCode,
  type QuoteTrendDatum,
} from "../data";
import type { AttritionComponentProps } from "../type";
import { formatPercent } from "../../../../utils/formatters";
import style from "./PremiumOverview.module.css";

interface PremiumOverviewProps extends AttritionComponentProps {
  activeCurrencyCode?: PremiumCurrencyCode;
  channelSplitData?: PremiumChannelSplitDatum[];
  pendingData?: PendingQuoteByCountryDatum[];
  trendData?: QuoteTrendDatum[];
}

interface ChannelCardDatum {
  accentColor: string;
  accentGlowRgb: string;
  channel: PremiumChannelSplitDatum["channel"];
  conversionRate: number;
  pendingQuotes: number;
  share: number;
  totalQuote: number;
}

const CHANNEL_ORDER = ["Web", "Contact Center"] as const;

const CHANNEL_VISUALS: Record<
  PremiumChannelSplitDatum["channel"],
  { accentColor: string; accentGlowRgb: string }
> = {
  "Contact Center": {
    accentColor: "#6f8dff",
    accentGlowRgb: "111, 141, 255",
  },
  Web: {
    accentColor: "#58c89a",
    accentGlowRgb: "88, 200, 154",
  },
};

const formatWholeNumber = (value: number) => value.toLocaleString("en-GB");

const allocateByShare = (
  total: number,
  channels: ReadonlyArray<PremiumChannelSplitDatum["channel"]>,
  shareMap: Map<PremiumChannelSplitDatum["channel"], number>,
) => {
  let remaining = total;

  return channels.reduce(
    (map, channel, index) => {
      const share = shareMap.get(channel) ?? 0;
      const allocated =
        index === channels.length - 1
          ? remaining
          : Math.max(0, Math.round((total * share) / 100));

      remaining -= allocated;
      map.set(channel, allocated);
      return map;
    },
    new Map<PremiumChannelSplitDatum["channel"], number>(),
  );
};

const buildChannelCards = (
  channels: PremiumChannelSplitDatum[],
  pendingRows: PendingQuoteByCountryDatum[],
  trendRows: QuoteTrendDatum[],
) => {
  const orderedChannels = CHANNEL_ORDER.map(
    (channelName) =>
      channels.find((channel) => channel.channel === channelName) ?? {
        channel: channelName,
        contribution: 0,
        fill: CHANNEL_VISUALS[channelName].accentColor,
        totalPremium: 0,
      },
  );

  const shareMap = new Map(
    orderedChannels.map((channel) => [channel.channel, channel.contribution]),
  );

  const latestTrend = trendRows[trendRows.length - 1];
  const totalQuote = latestTrend?.totalQuote ?? 0;
  const overallConversionRate = latestTrend?.conversionRate ?? 0;
  const totalPendingQuotes = pendingRows.reduce(
    (sum, row) => sum + row.pendingQuotes,
    0,
  );

  const quoteAllocations = allocateByShare(totalQuote, CHANNEL_ORDER, shareMap);
  const pendingAllocations = allocateByShare(
    totalPendingQuotes,
    CHANNEL_ORDER,
    shareMap,
  );

  return orderedChannels.map((channel) => {
    const rateBias = (channel.contribution - 50) / 60;
    const conversionRate = Math.max(
      0,
      Number((overallConversionRate + rateBias).toFixed(1)),
    );

    return {
      ...CHANNEL_VISUALS[channel.channel],
      channel: channel.channel,
      conversionRate,
      pendingQuotes: pendingAllocations.get(channel.channel) ?? 0,
      share: channel.contribution,
      totalQuote: quoteAllocations.get(channel.channel) ?? 0,
    } satisfies ChannelCardDatum;
  });
};

const DonutChart: React.FC<{
  accentColor: string;
  share: number;
}> = ({ accentColor, share }) => (
  <div className={style.gaugeWrap}>
    <svg
      aria-hidden="true"
      className={style.gauge}
      viewBox="0 0 220 220"
    >
      <circle
        className={style.gaugeTrack}
        cx="110"
        cy="110"
        fill="none"
        pathLength={100}
        r="72"
      />
      <circle
        className={style.gaugeFill}
        cx="110"
        cy="110"
        fill="none"
        pathLength={100}
        r="72"
        stroke={accentColor}
        strokeDasharray={`${share} 100`}
      />
    </svg>

    <div className={style.gaugeCenter}>
      <strong className={style.gaugeValue}>{formatPercent(share)}</strong>
      <span className={style.gaugeLabel}>Share of Total</span>
    </div>
  </div>
);

const PremiumOverview: React.FC<PremiumOverviewProps> = ({
  channelSplitData = premiumChannelSplitData,
  className,
  pendingData = pendingQuoteByCountryData,
  trendData: trendRows = trendData,
}) => {
  const channelCards = buildChannelCards(channelSplitData, pendingData, trendRows);

  return (
    <Card className={className}>
      <div className={style.root}>
        <div className={style.header}>
          <div className={style.headerCopy}>
            <div className="cardTitle">Channel Distribution</div>
          </div>
        </div>

        <section className={style.panelStack}>
          {channelCards.map((channel) => (
            <article
              className={style.channelCard}
              key={channel.channel}
              style={
                {
                  "--channel-accent": channel.accentColor,
                  "--channel-glow-rgb": channel.accentGlowRgb,
                } as CSSProperties
              }
            >
              <div className={style.channelCardHeader}>
                <div className={style.channelTitleRow}>
                  <span className={style.channelDot} />
                  <span className={`innerCardTitle ${style.channelTitle}`}>
                    {channel.channel}
                  </span>
                </div>
              </div>

              <DonutChart
                accentColor={channel.accentColor}
                share={channel.share}
              />

              <div className={style.metricList}>
                <div className={style.metricRow}>
                  <span className={style.metricLabel}>Conversion Rate</span>
                  <strong className={style.metricValue}>
                    {formatPercent(channel.conversionRate)}
                  </strong>
                </div>
                <div className={style.metricRow}>
                  <span className={style.metricLabel}>Pending Quotes</span>
                  <strong className={style.metricValue}>
                    {formatWholeNumber(channel.pendingQuotes)}
                  </strong>
                </div>
                <div className={style.metricRow}>
                  <span className={style.metricLabel}>Total Quote</span>
                  <strong className={style.metricValue}>
                    {formatWholeNumber(channel.totalQuote)}
                  </strong>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </Card>
  );
};

export default PremiumOverview;
