import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FaCheck, FaChevronDown } from "react-icons/fa6";
import { trendSeriesOptions } from "../QuotePerformance/config";
import type { TrendSeriesKey } from "../QuotePerformance/types";
import { getActiveTrendSeries, getMetricViewDescriptor } from "../metricView";
import style from "./MetricViewDropdown.module.css";

interface MetricViewDropdownProps {
  activeKey: TrendSeriesKey;
  onChange: (key: TrendSeriesKey) => void;
}

const MetricViewDropdown: React.FC<MetricViewDropdownProps> = ({
  activeKey,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const activeSeries = getActiveTrendSeries(activeKey);
  const activeDescriptor = getMetricViewDescriptor(activeKey);
  const ActiveIcon = activeSeries.icon;
  const rootStyle = {
    "--metric-accent": activeSeries.color,
  } as CSSProperties;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={style.root} ref={rootRef} style={rootStyle}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Metric view: ${activeDescriptor.buttonLabel}`}
        className={`${style.trigger} ${isOpen ? style.triggerOpen : ""}`}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className={style.triggerLead}>
          <span className={style.triggerIconWrap}>
            <ActiveIcon aria-hidden="true" className={style.triggerIcon} />
          </span>
          <span className={style.triggerText}>{activeDescriptor.buttonLabel}</span>
        </span>
        <FaChevronDown
          aria-hidden="true"
          className={`${style.chevron} ${isOpen ? style.chevronOpen : ""}`}
        />
      </button>

      <div
        aria-hidden={!isOpen}
        className={`${style.menu} ${isOpen ? style.menuOpen : ""}`}
        role="listbox"
      >
        {trendSeriesOptions.map((option) => {
          const descriptor = getMetricViewDescriptor(option.key);
          const OptionIcon = option.icon;
          const isActive = option.key === activeKey;

          return (
            <button
              aria-selected={isActive}
              className={`${style.option} ${isActive ? style.optionActive : ""}`}
              key={option.key}
              onClick={() => {
                onChange(option.key);
                setIsOpen(false);
              }}
              role="option"
              type="button"
            >
              <span className={style.optionLead}>
                <span className={style.optionIconWrap}>
                  <OptionIcon aria-hidden="true" className={style.optionIcon} />
                </span>
                <span className={style.optionCopy}>
                  <span className={style.optionLabel}>
                    {descriptor.buttonLabel}
                  </span>
                  <span className={style.optionDescription}>
                    {descriptor.buttonDescription}
                  </span>
                </span>
              </span>
              <span className={style.optionStatus}>
                {isActive ? <FaCheck aria-hidden="true" /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MetricViewDropdown;
