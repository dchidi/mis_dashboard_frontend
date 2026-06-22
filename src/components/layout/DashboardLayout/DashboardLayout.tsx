import { useState } from "react";
import dayjs from "dayjs";
import { DatePickerInput } from "@mantine/dates";
import { useMediaQuery } from "@mantine/hooks";
import { RiDownloadCloud2Line } from "react-icons/ri";
import { SlCalender } from "react-icons/sl";
import style from "./DashboardLayout.module.css";
import Menu, { type DashboardMenuItem } from "../../ui/menu/Menu";
import { getReportingPeriodPresets } from "../../../utils/reportingPeriodPresets";

export type DashboardDateRange = [string | null, string | null];

interface DashboardLayoutProps {
  children: React.ReactNode;
  downloadAriaLabel?: string;
  downloadDisabled?: boolean;
  headerProfile?: React.ReactNode;
  menuItems?: DashboardMenuItem[];
  onDownload?: () => void;
  onReportingPeriodChange?: (value: DashboardDateRange) => void;
  reportingPeriod?: DashboardDateRange;
  showReportingPeriodControl?: boolean;
  title?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  downloadAriaLabel = "Download dashboard",
  downloadDisabled = false,
  headerProfile,
  menuItems,
  onDownload,
  onReportingPeriodChange,
  reportingPeriod,
  showReportingPeriodControl = true,
  title,
}) => {
  const isMobile = useMediaQuery("(max-width: 640px)") ?? false;
  const [internalReportingPeriod, setInternalReportingPeriod] =
    useState<DashboardDateRange>([
      dayjs().startOf("month").format("YYYY-MM-DD"),
      dayjs().format("YYYY-MM-DD"),
    ]);
  const resolvedReportingPeriod = reportingPeriod ?? internalReportingPeriod;
  const handleReportingPeriodChange = (value: DashboardDateRange) => {
    if (reportingPeriod === undefined) {
      setInternalReportingPeriod(value);
    }

    onReportingPeriodChange?.(value);
  };

  return (
    <div className={style.root}>
      <div className={style.headerShell}>
        <div className={style.header}>
          <div className={style.headerStart}>
            <h3 className={style.title}>{title}</h3>
          </div>

          <div className={style.actions}>
            {showReportingPeriodControl ? (
              <DatePickerInput
                aria-label="Select reporting period"
                className={style.datePicker}
                clearable
                dropdownType={isMobile ? "modal" : "popover"}
                leftSection={<SlCalender />}
                leftSectionPointerEvents="none"
                onChange={handleReportingPeriodChange}
                placeholder="Select period"
                presets={getReportingPeriodPresets()}
                styles={{
                  input: {
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(107, 99, 117, 0.18)",
                    borderRadius: "999px",
                    color: "var(--text-h)",
                    fontSize: "0.84rem",
                    fontWeight: 600,
                    height: isMobile ? "2rem" : "2.2rem",
                  },
                  label: { display: "none" },
                  section: {
                    color: "var(--text)",
                  },
                }}
                type="range"
                value={resolvedReportingPeriod}
                valueFormat="DD MMM YYYY"
              />
            ) : null}
            <button
              aria-label={downloadAriaLabel}
              className={style.iconButton}
              disabled={downloadDisabled}
              onClick={onDownload}
              type="button"
            >
              <RiDownloadCloud2Line />
            </button>
            {headerProfile ? (
              <div className={style.profileSlot}>{headerProfile}</div>
            ) : null}
          </div>
        </div>
      </div>

      {menuItems?.length ? (
        <div className={style.row}>
          <Menu items={menuItems} />
          <div className={`${style.content} ${style.contentWithMenu}`}>
            {children}
          </div>
        </div>
      ) : (
        <div className={style.content}>{children}</div>
      )}
    </div>
  );
};

export default DashboardLayout;
