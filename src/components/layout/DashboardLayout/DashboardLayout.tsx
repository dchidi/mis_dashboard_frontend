import { useState } from "react";
import { RiDownloadCloud2Line } from "react-icons/ri";
import { SlCalender } from "react-icons/sl";
import style from "./DashboardLayout.module.css";
import Menu, { type DashboardMenuItem } from "../../ui/menu/Menu";
import ReportingPeriodPicker, {
  type ReportingPeriodValue,
} from "../../ui/reporting_period_picker/ReportingPeriodPicker";
import { getDefaultReportingPeriod } from "../../../utils/reportingPeriodPresets";

export type DashboardDateRange = ReportingPeriodValue;

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

  const [internalReportingPeriod, setInternalReportingPeriod] =
    useState<DashboardDateRange>(getDefaultReportingPeriod);
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
              <ReportingPeriodPicker
                ariaLabel="Select reporting period"
                className={style.datePicker}
                clearable
                leftSection={<SlCalender />}
                leftSectionPointerEvents="none"
                onChange={handleReportingPeriodChange}
                placeholder="Select a date or range"
                value={resolvedReportingPeriod}
                variant="compact"
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
