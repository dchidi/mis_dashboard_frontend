import { DatePickerInput, type DatePickerInputProps } from "@mantine/dates";
import { useMediaQuery } from "@mantine/hooks";
import { getReportingPeriodPresets } from "../../../utils/reportingPeriodPresets";

export type ReportingPeriodValue = [string | null, string | null];

type RangePickerProps = DatePickerInputProps<"range">;

interface ReportingPeriodPickerProps
  extends Omit<
    RangePickerProps,
    | "allowSingleDateInRange"
    | "dropdownType"
    | "modalProps"
    | "onChange"
    | "popoverProps"
    | "presets"
    | "styles"
    | "type"
    | "value"
    | "valueFormat"
  > {
  ariaLabel: string;
  modalTitle?: string;
  onChange: (value: ReportingPeriodValue) => void;
  value: ReportingPeriodValue;
  variant?: "compact" | "field";
  zIndex?: number;
}

const getPickerStyles = (
  variant: ReportingPeriodPickerProps["variant"],
  isMobile: boolean,
) => ({
  dropdown: {
    backdropFilter: "blur(20px)",
    background:
      "linear-gradient(180deg, rgba(43, 46, 60, 0.98), rgba(35, 38, 51, 0.98))",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  },
  input:
    variant === "compact"
      ? {
          backgroundColor: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(107, 99, 117, 0.18)",
          borderRadius: "999px",
          color: "var(--text-h)",
          fontSize: "0.84rem",
          fontWeight: 600,
          height: isMobile ? "2rem" : "2.2rem",
        }
      : {
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(107, 99, 117, 0.18)",
          borderRadius: "1rem",
          color: "var(--text-h)",
          fontSize: "0.92rem",
          fontWeight: 600,
          height: "3.15rem",
        },
  label: {
    display: "none",
  },
  section: {
    color: "var(--text)",
  },
});

const ReportingPeriodPicker: React.FC<ReportingPeriodPickerProps> = ({
  ariaLabel,
  modalTitle,
  onChange,
  value,
  variant = "field",
  zIndex = 2600,
  ...rest
}) => {
  const isMobile = useMediaQuery("(max-width: 640px)") ?? false;
  return (
    <DatePickerInput
      {...rest}
      allowSingleDateInRange
      aria-label={ariaLabel}
      dropdownType="modal"
      modalProps={{
        centered: true,
        title: modalTitle ?? ariaLabel,
        zIndex,
      }}
      onChange={onChange}
      presets={getReportingPeriodPresets()}
      styles={getPickerStyles(variant, isMobile)}
      type="range"
      value={value}
      valueFormat="DD MMM YYYY"
    />
  );
};

export default ReportingPeriodPicker;
