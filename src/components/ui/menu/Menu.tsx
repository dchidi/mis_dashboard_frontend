import clsx from "clsx";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import type { IconType } from "react-icons";
import { FaChevronRight } from "react-icons/fa6";
import { useAuth } from "../../../context/AuthContext";
import type { AuthMenuKey } from "../../../services/auth";
import style from "./Menu.module.css";

export interface DashboardMenuItem {
  end?: boolean;
  icon: IconType;
  label: string;
  permissionKey?: AuthMenuKey;
  to: string;
}

interface MenuProps {
  className?: string;
  inline?: boolean;
  items: DashboardMenuItem[];
}

const Menu: React.FC<MenuProps> = ({ className, inline = false, items }) => {
  const [expanded, setExpanded] = useState(false);

  const { allowedMenuKeys } = useAuth();
  const visibleItems = items.filter(
    ({ permissionKey }) =>
      !permissionKey || allowedMenuKeys.includes(permissionKey),
  );

  const handleNavigate = () => {
    setExpanded(false);
  };

  return (
    <div className={clsx(style.root, inline && style.rootInline, className)}>
      {expanded ? (
        <button
          aria-label="Collapse dashboard menu"
          className={style.backdrop}
          onClick={() => setExpanded(false)}
          type="button"
        />
      ) : null}

      <nav
        aria-label="Dashboard sections"
        className={clsx(style.panel, expanded && style.panelExpanded)}
      >
        <button
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse dashboard menu" : "Expand dashboard menu"}
          className={style.toggleButton}
          onClick={() => setExpanded((value) => !value)}
          type="button"
        >
          <span aria-hidden="true" className={style.toggleCaret}>
            <FaChevronRight />
          </span>
        </button>

        <ul className={style.list}>
          {visibleItems.map(({ end, icon: Icon, label, to }) => (
            <li className={style.listItem} key={to}>
              <NavLink
                className={({ isActive }) =>
                  clsx(style.link, isActive && style.linkActive)
                }
                end={end}
                onClick={handleNavigate}
                title={label}
                to={to}
              >
                <span aria-hidden="true" className={style.iconBox}>
                  <Icon />
                </span>
                <span className={style.label}>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Menu;