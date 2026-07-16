import type { DashboardDateRange } from "../../components/layout/DashboardLayout/DashboardLayout";

export type V2EtlJobKey = "free-policy" | "quote";
export type V2EtlRouteKey = V2EtlJobKey | "all";
export type V2EtlJobState = "pending" | "running" | "completed" | "failed";
export type V2EtlDateRange = DashboardDateRange;

export interface V2EtlJob {
  key: V2EtlJobKey;
  label: string;
  message: string;
  regionsLoaded?: number;
  rowsLoaded?: number;
  state: V2EtlJobState;
}

export interface V2EtlEvent {
  id: string;
  text: string;
  timestamp: string;
}

export interface V2EtlRouteOption {
  caption: string;
  description: string;
  jobKeys: V2EtlJobKey[];
  key: V2EtlRouteKey;
  label: string;
}

export interface V2EtlStatusSummary {
  currentDate: string;
  isCurrent: boolean;
  lastLoadedAt: string | null;
  tableName: string;
  totalRows: number;
}
