import clsx from "clsx";
import { type CSSProperties } from "react";
import { FaRegLightbulb } from "react-icons/fa6";
import style from "./InsightButton.module.css";

interface InsightButtonProps {
  accentRgb?: string;
  ariaLabel: string;
  className?: string;
  onClick: () => void;
  title?: string;
}

const InsightButton: React.FC<InsightButtonProps> = ({
  accentRgb = "212, 117, 88",
  ariaLabel,
  className,
  onClick,
  title,
}) => {
  const buttonStyle = {
    "--insight-rgb": accentRgb,
  } as CSSProperties;

  return (
    <button
      aria-haspopup="dialog"
      aria-label={ariaLabel}
      className={clsx(style.root, className)}
      onClick={onClick}
      style={buttonStyle}
      title={title}
      type="button"
    >
      <FaRegLightbulb aria-hidden="true" className={style.icon} />
    </button>
  );
};

export default InsightButton;
