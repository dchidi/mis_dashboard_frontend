import {
  AttritionByDepartment,
  AttritionByGender,
  AttritionByGradeBand,
  AttritionByPotentialPredicators,
  AttritionSummary,
  QuoteTrend,
} from "../components/features/Attrition";
import DashboardLayout from "../components/layout/DashboardLayout/DashboardLayout";
import { dashboardMenuItems } from "../config/dashboardMenu";
import style from "./page_css/QuoteDashboard.module.css";

const renderChartView = () => (
  <div className={style.root}>
    <div className={style.leftColumn}>
      <AttritionSummary className={style.section} />
      <AttritionByPotentialPredicators className={style.section} />
    </div>

    <AttritionByGender className={style.middleColumn} />

    <div className={style.rightColumn}>
      <QuoteTrend className={style.section} />
      <div className={style.bottomRow}>
        <AttritionByDepartment className={style.section} />
        <AttritionByGradeBand className={style.section} />
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <DashboardLayout menuItems={dashboardMenuItems} title="Quote Dashboard">
      {renderChartView()}
    </DashboardLayout>
  );
};
export default Dashboard;
