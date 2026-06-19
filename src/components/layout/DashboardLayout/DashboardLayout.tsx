import { useState } from "react";
import dayjs from "dayjs";
import { DatePickerInput } from "@mantine/dates";
import { useMediaQuery } from "@mantine/hooks";
import { FaChartSimple, FaTableCellsLarge } from "react-icons/fa6";
import { RiDownloadCloud2Line } from "react-icons/ri";
import { SlCalender } from "react-icons/sl";
import style from "./DashboardLayout.module.css";
import Menu, { type DashboardMenuItem } from "../../ui/menu/Menu";

export type DashboardViewMode = "chart" | "table";

interface DashboardLayoutProps {
  children:
    | React.ReactNode
    | ((props: { viewMode: DashboardViewMode }) => React.ReactNode);
  menuItems?: DashboardMenuItem[];
  showViewToggle?: boolean;
  title?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  menuItems,
  showViewToggle = true,
  title,
}) => {
  const [viewMode, setViewMode] = useState<DashboardViewMode>("chart");
  const isMobile = useMediaQuery("(max-width: 640px)") ?? false;
  const [reportingPeriod, setReportingPeriod] = useState<
    [string | null, string | null]
  >([
    dayjs().startOf("month").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
  ]);

  const content =
    typeof children === "function" ? children({ viewMode }) : children;

  return (
    <div className={style.root}>
      <div className={style.header}>
        <h3 className={style.title}>{title}</h3>

        <div className={style.actions}>
          <DatePickerInput
            aria-label="Select reporting period"
            className={style.datePicker}
            clearable
            dropdownType={isMobile ? "modal" : "popover"}
            leftSection={<SlCalender />}
            leftSectionPointerEvents="none"
            onChange={setReportingPeriod}
            placeholder="Select period"
            presets={[
              {
                label: "This month",
                value: [
                  dayjs().startOf("month").format("YYYY-MM-DD"),
                  dayjs().format("YYYY-MM-DD"),
                ],
              },
              {
                label: "Last month",
                value: [
                  dayjs()
                    .subtract(1, "month")
                    .startOf("month")
                    .format("YYYY-MM-DD"),
                  dayjs()
                    .subtract(1, "month")
                    .endOf("month")
                    .format("YYYY-MM-DD"),
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
                label: "Year to date",
                value: [
                  dayjs().startOf("year").format("YYYY-MM-DD"),
                  dayjs().format("YYYY-MM-DD"),
                ],
              },
            ]}
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
            value={reportingPeriod}
            valueFormat="DD MMM YYYY"
          />
          <button
            aria-label="Download dashboard"
            className={style.iconButton}
            type="button"
          >
            <RiDownloadCloud2Line />
          </button>

          {showViewToggle ? (
            <div
              aria-label="Switch dashboard view"
              className={style.viewToggle}
              role="tablist"
            >
              <button
                aria-label="Show chart view"
                aria-selected={viewMode === "chart"}
                className={`${style.toggleButton} ${
                  viewMode === "chart" ? style.toggleButtonActive : ""
                }`}
                onClick={() => setViewMode("chart")}
                role="tab"
                title="Chart view"
                type="button"
              >
                <FaChartSimple aria-hidden="true" />
              </button>
              <button
                aria-label="Show table view"
                aria-selected={viewMode === "table"}
                className={`${style.toggleButton} ${
                  viewMode === "table" ? style.toggleButtonActive : ""
                }`}
                onClick={() => setViewMode("table")}
                role="tab"
                title="Table view"
                type="button"
              >
                <FaTableCellsLarge aria-hidden="true" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {menuItems?.length ? (
        <div className={style.row}>
          <Menu items={menuItems} />
          <div className={`${style.content} ${style.contentWithMenu}`}>
            {content}
          </div>
        </div>
      ) : (
        <div className={style.content}>{content}</div>
      )}
    </div>
  );
};

export default DashboardLayout;
