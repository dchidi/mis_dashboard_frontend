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
    permissionKey: "quote",
    to: "/quote_dashboard",
  },
  {
    icon: FaFileShield,
    label: "Policy",
    permissionKey: "policy",
    to: "/policy",
  },
  {
    icon: FaArrowsRotate,
    label: "Renewals",
    permissionKey: "renewals",
    to: "/renewals",
  },
  {
    icon: FaChartLine,
    label: "Reports",
    permissionKey: "reports",
    to: "/reports",
  },
];
