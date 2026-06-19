import type { DashboardMenuItem } from "../components/ui/menu/Menu";
import {
  FaArrowTrendDown,
  FaCalendarXmark,
  FaChartLine,
  FaGraduationCap,
  FaUserGroup,
  FaUsers,
} from "react-icons/fa6";

export const dashboardMenuItems: DashboardMenuItem[] = [
  {
    end: true,
    icon: FaArrowTrendDown,
    label: "Attrition",
    to: "/",
  },
  {
    icon: FaUsers,
    label: "Headcount",
    to: "/headcount",
  },
  {
    icon: FaUserGroup,
    label: "Demographics",
    to: "/demographics",
  },
  {
    icon: FaCalendarXmark,
    label: "Absence",
    to: "/absence",
  },
  {
    icon: FaGraduationCap,
    label: "Learning",
    to: "/learning-development",
  },
  {
    icon: FaChartLine,
    label: "Planning",
    to: "/planning",
  },
];
