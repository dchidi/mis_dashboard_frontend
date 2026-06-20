import { joinClassNames } from "./helpers";
import type { KeyAlert } from "./types";
import style from "./QuotePerformance.module.css";

const KeyAlerts: React.FC<{ alerts: KeyAlert[] }> = ({ alerts }) => {
  return (
    <section className={style.alertPanel}>
      <div className={style.alertPanelTitle}>Key Alerts</div>
      <div className={style.alertList}>
        {alerts.map((alert) => (
          <article className={style.alertItem} key={alert.id}>
            <span
              className={joinClassNames(
                style.alertBadge,
                alert.severity === "high"
                  ? style.alertHigh
                  : alert.severity === "medium"
                    ? style.alertMedium
                    : style.alertLow,
              )}
            >
              <span aria-hidden="true" className={style.alertBadgeDot} />
            </span>
            <div className={style.alertContent}>
              <span className={style.alertEyebrow}>{alert.tone}</span>
              <p className={style.alertText}>{alert.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default KeyAlerts;
