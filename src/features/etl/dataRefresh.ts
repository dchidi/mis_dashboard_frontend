import { useEffect, useState } from "react";

import type { V2EtlJobKey } from "./types";

const V2_ETL_DATA_REFRESH_EVENT = "marketing-crm:v2-etl-data-refresh";

export interface V2EtlDataRefreshDetail {
  completedAt: string;
  endDate: string;
  jobKeys: V2EtlJobKey[];
  startDate: string;
}

export const publishV2EtlDataRefresh = (
  detail: V2EtlDataRefreshDetail,
) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<V2EtlDataRefreshDetail>(V2_ETL_DATA_REFRESH_EVENT, {
      detail,
    }),
  );
};

export const useV2EtlDataRevision = (jobKey: V2EtlJobKey): number => {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const handleDataRefresh = (event: Event) => {
      const detail = (event as CustomEvent<V2EtlDataRefreshDetail>).detail;
      if (!detail?.jobKeys?.includes(jobKey)) {
        return;
      }

      setRevision((current) => current + 1);
    };

    window.addEventListener(V2_ETL_DATA_REFRESH_EVENT, handleDataRefresh);
    return () => {
      window.removeEventListener(V2_ETL_DATA_REFRESH_EVENT, handleDataRefresh);
    };
  }, [jobKey]);

  return revision;
};
