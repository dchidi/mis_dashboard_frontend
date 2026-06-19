import Card from "../../../ui/card/Card";
import Table, { type TableColumn } from "../../../ui/table/Table";
import { predictorData, type AttritionPredictorDatum } from "../data";
import type { AttritionComponentProps } from "../type";
import style from "./AttritionPotentialPredicators.module.css";

const predictorColumns: TableColumn<AttritionPredictorDatum>[] = [
  {
    key: "predictor",
    header: "Predictor",
    isRowHeader: true,
    render: (row) => row.predictor,
    width: "42%",
  },
  {
    key: "cohort",
    header: "Cohort",
    render: (row) => `${row.cohortCount} employees`,
  },
  {
    key: "rate",
    header: "Rate",
    render: (row) => `${row.attritionRate}%`,
  },
];

const AttritionByPotentialPredicators: React.FC<AttritionComponentProps> = ({
  className,
}) => {
  return (
    <Card className={className}>
      <div className={style.root}>
        <div className="cardTitle">Potential Predictors</div>
        <p className={style.description}>
          Sample segments currently showing above-average attrition
          concentration.
        </p>

        <Table
          className={style.tableRegion}
          columns={predictorColumns}
          layout="fixed"
          minWidth="30rem"
          mobileMinWidth="27rem"
          rowKey={(row) => row.predictor}
          rows={predictorData}
          size="small"
        />
      </div>
    </Card>
  );
};
export default AttritionByPotentialPredicators;
