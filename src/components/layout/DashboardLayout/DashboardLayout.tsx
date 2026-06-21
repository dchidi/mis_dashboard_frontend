import { useState } from "react";
import dayjs from "dayjs";
import { DatePickerInput } from "@mantine/dates";
import { useMediaQuery } from "@mantine/hooks";
import { RiDownloadCloud2Line } from "react-icons/ri";
import { SlCalender } from "react-icons/sl";
import style from "./DashboardLayout.module.css";
import Menu, { type DashboardMenuItem } from "../../ui/menu/Menu";

interface DashboardLayoutProps {
  children: React.ReactNode;
  headerProfile?: React.ReactNode;
  menuItems?: DashboardMenuItem[];
  title?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  headerProfile,
  menuItems,
  title,
}) => {
  const isMobile = useMediaQuery("(max-width: 640px)") ?? false;
  const [reportingPeriod, setReportingPeriod] = useState<
    [string | null, string | null]
  >([
    dayjs().startOf("month").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
  ]);

  return (
    <div className={style.root}>
      <div className={style.headerShell}>
        <div className={style.header}>
          <div className={style.headerStart}>
            <h3 className={style.title}>{title}</h3>
          </div>

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
