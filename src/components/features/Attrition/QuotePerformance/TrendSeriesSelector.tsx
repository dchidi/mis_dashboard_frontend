import { trendSeriesOptions } from "./config";
import { joinClassNames } from "./helpers";
import type { TrendSeriesKey } from "./types";
import style from "./QuotePerformance.module.css";

interface TrendSeriesSelectorProps {
  activeKey: TrendSeriesKey;
  ariaLabel?: string;
  onChange: (key: TrendSeriesKey) => void;
}

const TrendSeriesSelector: React.FC<TrendSeriesSelectorProps> = ({
  activeKey,
  ariaLabel = "Quote metric",
  onChange,
}) => {
  return (
    <div
      aria-label={ariaLabel}
      className={style.trendSeriesGroup}
      role="group"
    >
      {trendSeriesOptions.map((series) => {
        const isActive = series.key === activeKey;
        const SeriesIcon = series.icon;

        return (
          <button
            aria-label={series.label}
            aria-pressed={isActive}
            className={joinClassNames(
              style.trendSeriesButton,
              isActive && style.trendSeriesButtonActive,
            )}
            key={series.key}
            onClick={() => onChange(series.key)}
            title={series.label}
            type="button"
          >
            <SeriesIcon
              aria-hidden="true"
              className={style.trendSeriesButtonIcon}
            />
          </button>
        );
      })}
    </div>
  );
};

export default TrendSeriesSelector;
