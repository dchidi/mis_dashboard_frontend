import type { CSSProperties } from "react";
import clsx from "clsx";
import style from "./Skeleton.module.css";

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, style: inlineStyle }) => (
  <div
    aria-hidden="true"
    className={clsx(style.root, className)}
    style={inlineStyle}
  />
);

export default Skeleton;
