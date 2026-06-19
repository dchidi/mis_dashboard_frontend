import {
  AttritionByDepartment,
  AttritionByGender,
  AttritionByGradeBand,
  AttritionByPotentialPredicators,
  AttritionSummary,
  AttritionTablesView,
  AttritionTrend,
} from "../components/features/Attrition";
import DashboardLayout, {
  type DashboardViewMode,
} from "../components/layout/DashboardLayout/DashboardLayout";
import { dashboardMenuItems } from "../config/dashboardMenu";
import style from "./AttritionDashboard.module.css";

const renderChartView = () => (
  <div className={style.root}>
    <div className={`${style.row} ${style.left}`}>
      <div className={style.col}>
        <AttritionSummary className={style.col} />
        <AttritionByPotentialPredicators className={style.col} />
      </div>

      <AttritionByGender className={style.middleSection} />
    </div>

    <div className={style.col}>
      <AttritionTrend className={style.section} />
      <div className={style.row}>
        <AttritionByDepartment className={style.section} />
        <AttritionByGradeBand className={style.section} />
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <DashboardLayout menuItems={dashboardMenuItems} title="Attrition Analysis">
      {({ viewMode }: { viewMode: DashboardViewMode }) =>
        viewMode === "table" ? <AttritionTablesView /> : renderChartView()
      }
    </DashboardLayout>
  );
};
export default Dashboard;
