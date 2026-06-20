import clsx from "clsx";
import type { CSSProperties } from "react";
import style from "./SegmentedTabs.module.css";

export interface SegmentedTabOption<TKey extends string> {
  key: TKey;
  label: string;
}

interface SegmentedTabsProps<TKey extends string> {
  activeKey: TKey;
  accentRgb?: string;
  ariaLabel: string;
  className?: string;
  idBase?: string;
  onChange: (key: TKey) => void;
  options: readonly SegmentedTabOption<TKey>[];
}

function SegmentedTabs<TKey extends string>({
  activeKey,
  accentRgb,
  ariaLabel,
  className,
  idBase,
  onChange,
  options,
}: SegmentedTabsProps<TKey>) {
  const rootStyle = accentRgb
    ? ({ "--segmented-accent-rgb": accentRgb } as CSSProperties)
    : undefined;

  return (
    <div
      aria-label={ariaLabel}
      className={clsx(style.root, className)}
      role="tablist"
      style={rootStyle}
    >
      {options.map((option) => {
        const isActive = option.key === activeKey;

        return (
          <button
            aria-controls={idBase ? `${idBase}-panel-${option.key}` : undefined}
            aria-selected={isActive}
            className={clsx(style.button, isActive && style.buttonActive)}
            id={idBase ? `${idBase}-tab-${option.key}` : undefined}
            key={option.key}
            onClick={() => onChange(option.key)}
            role="tab"
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedTabs;
