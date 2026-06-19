import Card from "../components/ui/card/Card";
import DashboardLayout from "../components/layout/DashboardLayout/DashboardLayout";
import { dashboardMenuItems } from "../config/dashboardMenu";
import style from "./page_css/FeaturePlaceholderDashboard.module.css";

interface FeaturePlaceholderDashboardProps {
  description: string;
  focusAreas: string[];
  note: string;
  title: string;
}

const FeaturePlaceholderDashboard: React.FC<
  FeaturePlaceholderDashboardProps
> = ({ description, focusAreas, note, title }) => {
  return (
    <DashboardLayout menuItems={dashboardMenuItems} title={title}>
      <div className={style.root}>
        <Card className={style.hero}>
          <p className={style.eyebrow}>Dashboard shell ready</p>
          <h2 className={style.heroTitle}>{title}</h2>
          <p className={style.heroCopy}>{description}</p>

          <div className={style.pills}>
            {focusAreas.map((area) => (
              <span className={style.pill} key={area}>
                {area}
              </span>
            ))}
          </div>
        </Card>

        <div className={style.grid}>
          <Card className={style.panel}>
            <p className="cardTitle">What This View Should Surface</p>
            <ul className={style.list}>
              {focusAreas.map((area) => (
                <li className={style.listItem} key={area}>
                  {area}
                </li>
              ))}
            </ul>
          </Card>

          <Card className={style.panel}>
            <p className="cardTitle">Implementation Note</p>
            <p className={style.note}>
              This route is live and shares the same shell, filters, and menu as
              the attrition dashboard. The visual blocks for this section can
              now be added without reworking navigation.
            </p>
            <p className={style.noteAccent}>{note}</p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FeaturePlaceholderDashboard;
