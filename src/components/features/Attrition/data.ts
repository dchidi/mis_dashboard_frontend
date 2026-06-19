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

export interface QuoteTrendDatum {
  [key: string]: string | number;
  conversionRate: number;
  month: string;
  previousYearConversionRate: number;
  previousYearMonth: string;
  previousYearTotalQuote: number;
  previousYearTotalSales: number;
  totalQuote: number;
  totalSales: number;
}

export interface BrandContributionDatum {
  [key: string]: string | number;
  brand: string;
  fill: string;
  quoteCount: number;
  share: number;
  shareLabel: string;
}

export interface PetTypeMixDatum {
  [key: string]: string | number;
  fill: string;
  petType: string;
  quoteCount: number;
  share: number;
  shareLabel: string;
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

interface QuoteTrendBaseDatum {
  month: string;
  previousYearMonth: string;
  previousYearTotalQuote: number;
  previousYearTotalSales: number;
  totalQuote: number;
  totalSales: number;
}

const calculateConversionRate = (totalSales: number, totalQuote: number) =>
  totalQuote === 0 ? 0 : Number(((totalSales / totalQuote) * 100).toFixed(1));

const calculateShare = (value: number, total: number) =>
  total === 0 ? 0 : Number(((value / total) * 100).toFixed(1));

const trendBaseData: QuoteTrendBaseDatum[] = [
  {
    month: "Jan 25",
    previousYearMonth: "Jan 24",
    totalQuote: 585,
    totalSales: 24,
    previousYearTotalQuote: 548,
    previousYearTotalSales: 20,
  },
  {
    month: "Feb 25",
    previousYearMonth: "Feb 24",
    totalQuote: 600,
    totalSales: 18,
    previousYearTotalQuote: 563,
    previousYearTotalSales: 19,
  },
  {
    month: "Mar 25",
    previousYearMonth: "Mar 24",
    totalQuote: 600,
    totalSales: 12,
    previousYearTotalQuote: 571,
    previousYearTotalSales: 14,
  },
  {
    month: "Apr 25",
    previousYearMonth: "Apr 24",
    totalQuote: 572,
    totalSales: 16,
    previousYearTotalQuote: 539,
    previousYearTotalSales: 13,
  },
  {
    month: "May 25",
    previousYearMonth: "May 24",
    totalQuote: 590,
    totalSales: 23,
    previousYearTotalQuote: 554,
    previousYearTotalSales: 20,
  },
  {
    month: "Jun 25",
    previousYearMonth: "Jun 24",
    totalQuote: 583,
    totalSales: 14,
    previousYearTotalQuote: 547,
    previousYearTotalSales: 12,
  },
];

export const trendData: QuoteTrendDatum[] = trendBaseData.map((entry) => {
  const conversionRate = calculateConversionRate(
    entry.totalSales,
    entry.totalQuote,
  );
  const previousYearConversionRate = calculateConversionRate(
    entry.previousYearTotalSales,
    entry.previousYearTotalQuote,
  );

  return {
    ...entry,
    conversionRate,
    previousYearConversionRate,
  };
});

const brandContributionBaseData = [
  {
    brand: "Petcover",
    fill: "#d76853",
    quoteCount: 186,
  },
  {
    brand: "BPIS",
    fill: "#e29a45",
    quoteCount: 154,
  },
  {
    brand: "CoveryMy",
    fill: "#4e8df5",
    quoteCount: 132,
  },
  {
    brand: "BB Commercial",
    fill: "#33b18b",
    quoteCount: 108,
  },
  {
    brand: "Exotic Direct",
    fill: "#8a74e8",
    quoteCount: 81,
  },
  {
    brand: "Petcover Professional",
    fill: "#d75f9b",
    quoteCount: 64,
  },
];

export const brandContributionTotalQuotes = brandContributionBaseData.reduce(
  (sum, entry) => sum + entry.quoteCount,
  0,
);

export const brandContributionData: BrandContributionDatum[] =
  brandContributionBaseData.map((entry) => {
    const share = calculateShare(entry.quoteCount, brandContributionTotalQuotes);

    return {
      ...entry,
      share,
      shareLabel: `${share}%`,
    };
  });

export const topBrandContribution =
  brandContributionData.reduce<BrandContributionDatum | null>(
    (topEntry, entry) =>
      !topEntry || entry.quoteCount > topEntry.quoteCount ? entry : topEntry,
    null,
  );

const petTypeMixBaseData = [
  {
    petType: "Dogs",
    fill: "#c05a52",
    quoteCount: 214,
  },
  {
    petType: "Cats",
    fill: "#4e8df5",
    quoteCount: 168,
  },
  {
    petType: "Exotics",
    fill: "#33b18b",
    quoteCount: 97,
  },
  {
    petType: "Horses",
    fill: "#d7a13d",
    quoteCount: 72,
  },
  {
    petType: "Exotic Direct",
    fill: "#8a74e8",
    quoteCount: 64,
  },
  {
    petType: "BB Commercial",
    fill: "#d76853",
    quoteCount: 48,
  },
  {
    petType: "Petcover Professional",
    fill: "#d75f9b",
    quoteCount: 36,
  },
];

export const petTypeMixTotalQuotes = petTypeMixBaseData.reduce(
  (sum, entry) => sum + entry.quoteCount,
  0,
);

export const petTypeMixData: PetTypeMixDatum[] = petTypeMixBaseData.map(
  (entry) => {
    const share = calculateShare(entry.quoteCount, petTypeMixTotalQuotes);

    return {
      ...entry,
      share,
      shareLabel: `${share}%`,
    };
  },
);

export const topPetTypeMix = petTypeMixData.reduce<PetTypeMixDatum | null>(
  (topEntry, entry) =>
    !topEntry || entry.quoteCount > topEntry.quoteCount ? entry : topEntry,
  null,
);

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
