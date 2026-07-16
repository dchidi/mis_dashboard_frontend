import dayjs from "dayjs";

export interface ReportingPeriodPreset {
  label: string;
  value: [string, string];
}

export const getMonthToDateReportingPeriod = (): [string, string] => [
  dayjs().startOf("month").format("YYYY-MM-DD"),
  dayjs().format("YYYY-MM-DD"),
];

export const getReportingPeriodPresets = (): ReportingPeriodPreset[] => [
  {
    label: "This month",
    value: getMonthToDateReportingPeriod(),
  },
  {
    label: "Last month",
    value: [
      dayjs().subtract(1, "month").startOf("month").format("YYYY-MM-DD"),
      dayjs().subtract(1, "month").endOf("month").format("YYYY-MM-DD"),
    ],
  },
  {
    label: "Last 30 days",
    value: [
      dayjs().subtract(29, "day").format("YYYY-MM-DD"),
      dayjs().format("YYYY-MM-DD"),
    ],
  },
  {
    label: "Last 60 days",
    value: [
      dayjs().subtract(59, "day").format("YYYY-MM-DD"),
      dayjs().format("YYYY-MM-DD"),
    ],
  },
  {
    label: "Last 90 days",
    value: [
      dayjs().subtract(89, "day").format("YYYY-MM-DD"),
      dayjs().format("YYYY-MM-DD"),
    ],
  },
  {
    label: "Year to date",
    value: [
      dayjs().startOf("year").format("YYYY-MM-DD"),
      dayjs().format("YYYY-MM-DD"),
    ],
  },
  {
    label: "Last year",
    value: [
      dayjs().subtract(1, "year").startOf("year").format("YYYY-MM-DD"),
      dayjs().subtract(1, "year").endOf("year").format("YYYY-MM-DD"),
    ],
  },
];
