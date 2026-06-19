export interface AttritionPredictorDatum {
  attritionRate: number;
  cohortCount: number;
  predictor: string;
}

export interface AttritionSummaryDatum {
  averageHeadcount: number;
  exits: number;
  label: string;
}

export interface AttritionGenderDatum {
  [key: string]: string | number;
  attritionRate: number;
  color: string;
  exits: number;
  gender: "Male" | "Female";
  headcount: number;
  key: "male" | "female";
  shareOfHeadcount: number;
  shareOfTotalAttrition: number;
}

export interface AttritionTrendDatum {
  [key: string]: string | number;
  averageHeadcount: number;
  femaleAttrition: number;
  maleAttrition: number;
  month: string;
  retentionPercent: number;
  totalAttrition: number;
  turnoverRate: number;
}

export interface AttritionDepartmentDatum {
  [key: string]: string | number;
  attritionRate: number;
  department: string;
  fill: string;
  totalAttrition: number;
}

export interface AttritionGradeBandDatum {
  [key: string]: string | number;
  attritionRate: number;
  gradeBand: string;
  rateLabel: string;
  totalAttrition: number;
}

export const predictorData: AttritionPredictorDatum[] = [
  {
    predictor: "Tenure under 12 months",
    cohortCount: 84,
    attritionRate: 6.8,
  },
  {
    predictor: "No salary review in 12 months",
    cohortCount: 61,
    attritionRate: 5.7,
  },
  {
    predictor: "No promotion in 24 months",
    cohortCount: 47,
    attritionRate: 5.1,
  },
  {
    predictor: "Frequent overtime",
    cohortCount: 38,
    attritionRate: 4.9,
  },
  {
    predictor: "Recent manager change",
    cohortCount: 29,
    attritionRate: 4.2,
  },
];

export const currentPeriodSummary: AttritionSummaryDatum = {
  averageHeadcount: 583,
  exits: 14,
  label: "Current Period",
};

export const summaryAttritionRate = Number(
  (
    (currentPeriodSummary.exits / currentPeriodSummary.averageHeadcount) *
    100
  ).toFixed(1),
);

export const summaryRetentionRate = Number(
  (100 - summaryAttritionRate).toFixed(1),
);

const genderBaseData = [
  {
    key: "male" as const,
    gender: "Male" as const,
    headcount: 308,
    exits: 8,
    color: "#33b18b",
  },
  {
    key: "female" as const,
    gender: "Female" as const,
    headcount: 275,
    exits: 6,
    color: "#4e8df5",
  },
];

export const genderTotalAttrition = genderBaseData.reduce(
  (sum, group) => sum + group.exits,
  0,
);

const totalHeadcount = genderBaseData.reduce(
  (sum, group) => sum + group.headcount,
  0,
);

export const genderAttritionData: AttritionGenderDatum[] = genderBaseData.map(
  (group) => ({
    ...group,
    attritionRate: Number(((group.exits / group.headcount) * 100).toFixed(1)),
    shareOfHeadcount: Number(
      ((group.headcount / totalHeadcount) * 100).toFixed(1),
    ),
    shareOfTotalAttrition: Number(
      ((group.exits / genderTotalAttrition) * 100).toFixed(1),
    ),
  }),
);

interface AttritionTrendBaseDatum {
  averageHeadcount: number;
  femaleAttrition: number;
  maleAttrition: number;
  month: string;
  totalAttrition: number;
}

const trendBaseData: AttritionTrendBaseDatum[] = [
  {
    month: "Jan 25",
    averageHeadcount: 585,
    totalAttrition: 24,
    maleAttrition: 13,
    femaleAttrition: 11,
  },
  {
    month: "Feb 25",
    averageHeadcount: 600,
    totalAttrition: 18,
    maleAttrition: 10,
    femaleAttrition: 8,
  },
  {
    month: "Mar 25",
    averageHeadcount: 600,
    totalAttrition: 12,
    maleAttrition: 7,
    femaleAttrition: 5,
  },
  {
    month: "Apr 25",
    averageHeadcount: 572,
    totalAttrition: 16,
    maleAttrition: 9,
    femaleAttrition: 7,
  },
  {
    month: "May 25",
    averageHeadcount: 590,
    totalAttrition: 23,
    maleAttrition: 12,
    femaleAttrition: 11,
  },
  {
    month: "Jun 25",
    averageHeadcount: 583,
    totalAttrition: 14,
    maleAttrition: 8,
    femaleAttrition: 6,
  },
];

export const trendData: AttritionTrendDatum[] = trendBaseData.map((entry) => {
  const turnoverRate = Number(
    ((entry.totalAttrition / entry.averageHeadcount) * 100).toFixed(1),
  );

  return {
    ...entry,
    turnoverRate,
    retentionPercent: Number((100 - turnoverRate).toFixed(1)),
  };
});

export const departmentData: AttritionDepartmentDatum[] = [
  {
    department: "Operations",
    totalAttrition: 18,
    attritionRate: 4.3,
    fill: "#df4336",
  },
  {
    department: "Sales",
    totalAttrition: 16,
    attritionRate: 3.8,
    fill: "#23b5a7",
  },
  {
    department: "Support",
    totalAttrition: 12,
    attritionRate: 2.9,
    fill: "#4e8df5",
  },
  {
    department: "Finance",
    totalAttrition: 9,
    attritionRate: 2.1,
    fill: "#d7a13d",
  },
];

export const departmentTotalAttrition = departmentData.reduce(
  (sum, department) => sum + department.totalAttrition,
  0,
);

export const gradeBandData: AttritionGradeBandDatum[] = [
  {
    gradeBand: "G1-G2",
    attritionRate: 1.8,
    totalAttrition: 7,
    rateLabel: "1.8%",
  },
  {
    gradeBand: "G3-G4",
    attritionRate: 2.6,
    totalAttrition: 11,
    rateLabel: "2.6%",
  },
  {
    gradeBand: "G5-G6",
    attritionRate: 3.7,
    totalAttrition: 15,
    rateLabel: "3.7%",
  },
  {
    gradeBand: "G7+",
    attritionRate: 2.2,
    totalAttrition: 8,
    rateLabel: "2.2%",
  },
];
