import { petTypeMixData, type PetTypeMixDatum } from "../data";
import { formatCount, formatPercent, joinClassNames } from "./helpers";
import style from "./QuotePerformance.module.css";

interface PetTypeMixLegendProps {
  className?: string;
  data?: PetTypeMixDatum[];
}

const PetTypeMixLegend: React.FC<PetTypeMixLegendProps> = ({
  className,
  data = petTypeMixData,
}) => {
  return (
    <div className={joinClassNames(style.legend, className)}>
      {data.map((entry) => (
        <div className={style.legendItem} key={entry.petType}>
          <span
            className={style.legendSwatch}
            style={{ backgroundColor: entry.fill }}
          />
          <div className={style.legendText}>
            <span className={style.legendName} title={entry.petType}>
              {entry.petType}
            </span>
            <span className={style.legendMeta}>
              {formatCount(entry.quoteCount)} quotes
            </span>
          </div>
          <strong className={style.legendValue}>
            {formatPercent(entry.share)}
          </strong>
        </div>
      ))}
    </div>
  );
};

export default PetTypeMixLegend;
