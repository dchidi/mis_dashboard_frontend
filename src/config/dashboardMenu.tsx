import type { DashboardMenuItem } from "../components/ui/menu/Menu";
import {
  FaArrowsRotate,
  FaChartLine,
  FaFileLines,
  FaFileShield,
} from "react-icons/fa6";

export const dashboardMenuItems: DashboardMenuItem[] = [
  {
    end: true,
    icon: FaFileLines,
    label: "Quote",
    to: "/quote_dashboard",
  },
  {
    icon: FaFileShield,
    label: "Policy",
    to: "/policy",
  },
  {
    icon: FaArrowsRotate,
    label: "Renewals",
    to: "/renewals",
  },
  {
    icon: FaChartLine,
    label: "Reports",
    to: "/reports",
  },
];
