import clsx from "clsx";
import { type CSSProperties } from "react";
import style from "./InsightPanel.module.css";

export interface InsightPanelItem {
  id: string;
  label: string;
  note: string;
  tone: "negative" | "neutral" | "positive";
  value: string;
}

interface InsightPanelProps {
  accentRgb?: string;
  className?: string;
  items: InsightPanelItem[];
  title?: string;
}

const toneClassMap: Record<InsightPanelItem["tone"], string> = {
  negative: style.cardNegative,
  neutral: style.cardNeutral,
  positive: style.cardPositive,
};

const InsightPanel: React.FC<InsightPanelProps> = ({
  accentRgb,
  className,
  items,
  title = "Insights",
}) => {
  const rootStyle = accentRgb
    ? ({ "--insight-accent-rgb": accentRgb } as CSSProperties)
    : undefined;

  return (
    <aside className={clsx(style.root, className)} style={rootStyle}>
      <div className={style.header}>
        <div className={style.title}>{title}</div>
      </div>

      <div className={style.list}>
        {items.map((item) => (
          <article className={clsx(style.card, toneClassMap[item.tone])} key={item.id}>
            <div className={style.eyebrow}>{item.label}</div>
            <div className={style.value}>{item.value}</div>
            <p className={style.note}>{item.note}</p>
          </article>
        ))}
      </div>
    </aside>
  );
};

export default InsightPanel;
