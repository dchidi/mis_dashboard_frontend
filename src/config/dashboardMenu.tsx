import type { DashboardMenuItem } from "../components/ui/menu/Menu";
import {
  FaArrowsRotate,
  FaChartLine,
  FaFileInvoiceDollar,
  FaFileLines,
  FaFileShield,
} from "react-icons/fa6";

export const dashboardMenuItems: DashboardMenuItem[] = [
  {
    icon: FaFileInvoiceDollar,
    label: "Daily Sales Report",
    permissionKey: "dsr",
    to: "/dsr",
  },
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
