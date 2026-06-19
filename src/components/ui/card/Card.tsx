import clsx from "clsx";
import style from "./Card.module.css";

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ className, children }) => {
  const rootCss = clsx(style.root, className);
  return <div className={rootCss}>{children}</div>;
};
export default Card;
