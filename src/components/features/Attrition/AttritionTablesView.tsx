import Card from "../../ui/card/Card";
import {
  currentPeriodSummary,
  departmentData,
  genderAttritionData,
  gradeBandData,
  predictorData,
  summaryAttritionRate,
  summaryRetentionRate,
  trendData,
} from "./data";
import style from "./AttritionTablesView.module.css";

const AttritionTablesView: React.FC = () => {
  return (
    <div className={style.root}>
      <Card className={style.spanTwo}>
        <div className={style.cardBody}>
          <div className="cardTitle">Attrition Snapshot</div>
          <div className={style.tableWrap}>
            <table className={style.table}>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Basis</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Attrition Rate</td>
                  <td>{summaryAttritionRate}%</td>
                  <td>
                    {currentPeriodSummary.exits} exits /{" "}
                    {currentPeriodSummary.averageHeadcount} average headcount
                  </td>
                </tr>
                <tr>
                  <td>Retention Rate</td>
                  <td>{summaryRetentionRate}%</td>
                  <td>Same current-period workforce base</td>
                </tr>
                <tr>
                  <td>Current Period</td>
                  <td>{currentPeriodSummary.label}</td>
                  <td>{currentPeriodSummary.averageHeadcount} employees</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card className={style.spanTwo}>
        <div className={style.cardBody}>
          <div className="cardTitle">Monthly Attrition Trend</div>
          <div className={style.tableWrap}>
            <table className={style.table}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total Attrition</th>
                  <th>Rate</th>
                  <th>Male</th>
                  <th>Female</th>
                </tr>
              </thead>
              <tbody>
                {trendData.map((row) => (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td>{row.totalAttrition}</td>
                    <td>{row.turnoverRate}%</td>
                    <td>{row.maleAttrition}</td>
                    <td>{row.femaleAttrition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card>
        <div className={style.cardBody}>
          <div className="cardTitle">Attrition by Gender</div>
          <div className={style.tableWrap}>
            <table className={style.table}>
              <thead>
                <tr>
                  <th>Gender</th>
                  <th>Headcount</th>
                  <th>Exits</th>
                  <th>Attrition Rate</th>
                  <th>Share of Exits</th>
                </tr>
              </thead>
              <tbody>
                {genderAttritionData.map((row) => (
                  <tr key={row.key}>
                    <td>{row.gender}</td>
                    <td>{row.headcount}</td>
                    <td>{row.exits}</td>
                    <td>{row.attritionRate}%</td>
                    <td>{row.shareOfTotalAttrition}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card>
        <div className={style.cardBody}>
          <div className="cardTitle">Attrition by Department</div>
          <div className={style.tableWrap}>
            <table className={style.table}>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Total Attrition</th>
                  <th>Attrition Rate</th>
                </tr>
              </thead>
              <tbody>
                {departmentData.map((row) => (
                  <tr key={row.department}>
                    <td>{row.department}</td>
                    <td>{row.totalAttrition}</td>
                    <td>{row.attritionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card>
        <div className={style.cardBody}>
          <div className="cardTitle">Attrition by Grade/Band</div>
          <div className={style.tableWrap}>
            <table className={style.table}>
              <thead>
                <tr>
                  <th>Grade/Band</th>
                  <th>Total Attrition</th>
                  <th>Attrition Rate</th>
                </tr>
              </thead>
              <tbody>
                {gradeBandData.map((row) => (
                  <tr key={row.gradeBand}>
                    <td>{row.gradeBand}</td>
                    <td>{row.totalAttrition}</td>
                    <td>{row.attritionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Card>
        <div className={style.cardBody}>
          <div className="cardTitle">Potential Predictors</div>
          <div className={style.tableWrap}>
            <table className={style.table}>
              <thead>
                <tr>
                  <th>Predictor</th>
                  <th>Cohort</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {predictorData.map((row) => (
                  <tr key={row.predictor}>
                    <td>{row.predictor}</td>
                    <td>{row.cohortCount} employees</td>
                    <td>{row.attritionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AttritionTablesView;
