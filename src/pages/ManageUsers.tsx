import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import { FaAngleDown, FaCheck } from "react-icons/fa6";
import Card from "../components/ui/card/Card";
import Table, { type TableColumn } from "../components/ui/table/Table";
import DashboardLayout from "../components/layout/DashboardLayout/DashboardLayout";
import DashboardProfileMenu from "../components/ui/dashboard_profile_menu/DashboardProfileMenu";
import { dashboardMenuItems } from "../config/dashboardMenu";
import {
  brandFilterOptions,
  countryFilterOptions,
  currencyFilterOptions,
  metricFilterOptions,
  petTypeFilterOptions,
} from "../components/features/Attrition/dashboardState";
import type { PremiumCurrencyCode } from "../components/features/Attrition/data";
import type { TrendSeriesKey } from "../components/features/Attrition/QuotePerformance/types";
import style from "./page_css/ManageUsers.module.css";
import { useAuth } from "../context/AuthContext";
import { getUserNameParts } from "../utils/auth";

type UserRole = "Admin" | "Analyst" | "Executive" | "Viewer";
type UserStatus = "Active" | "Password change required";

interface UserRow {
  email: string;
  id: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  updatedAt: string;
}

const roleOptions: UserRole[] = ["Admin", "Analyst", "Executive", "Viewer"];

const initialUsers: UserRow[] = [
  {
    email: "chidi.duru@company.com",
    id: "usr-1",
    name: "Chidi Duru",
    role: "Admin",
    status: "Active",
    updatedAt: "21 Jun 2026",
  },
  {
    email: "amara.okafor@company.com",
    id: "usr-2",
    name: "Amara Okafor",
    role: "Executive",
    status: "Active",
    updatedAt: "19 Jun 2026",
  },
  {
    email: "liam.kelly@company.com",
    id: "usr-3",
    name: "Liam Kelly",
    role: "Analyst",
    status: "Password change required",
    updatedAt: "20 Jun 2026",
  },
  {
    email: "olivia.stone@company.com",
    id: "usr-4",
    name: "Olivia Stone",
    role: "Viewer",
    status: "Active",
    updatedAt: "18 Jun 2026",
  },
];

const formatToday = () =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

const ManageUsers: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, logout, user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("Analyst");
  const [formError, setFormError] = useState("");
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement | null>(null);

  const totalAdmins = useMemo(
    () => users.filter((user) => user.role === "Admin").length,
    [users],
  );
  const passwordRequests = useMemo(
    () =>
      users.filter((user) => user.status === "Password change required").length,
    [users],
  );
  const { firstName, lastName } = getUserNameParts(user);

  useEffect(() => {
    if (!isRoleMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!roleMenuRef.current?.contains(event.target as Node)) {
        setIsRoleMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsRoleMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isRoleMenuOpen]);

  const requestPasswordChange = (id: string) => {
    setUsers((current) =>
      current.map((user) =>
        user.id === id
          ? {
              ...user,
              status: "Password change required",
              updatedAt: formatToday(),
            }
          : user,
      ),
    );
  };

  const deleteUser = (id: string) => {
    const targetUser = users.find((user) => user.id === id);
    if (!targetUser) {
      return;
    }

    const confirmed = window.confirm(
      `Delete ${targetUser.name} from user access?`,
    );

    if (!confirmed) {
      return;
    }

    setUsers((current) => current.filter((user) => user.id !== id));
  };

  const handleAddUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) {
      setFormError("Name and email are required.");
      return;
    }

    if (!/.+@.+\..+/.test(normalizedEmail)) {
      setFormError("Enter a valid email address.");
      return;
    }

    if (
      users.some((user) => user.email.toLowerCase() === normalizedEmail)
    ) {
      setFormError("That email already exists.");
      return;
    }

    setUsers((current) => [
      {
        email: normalizedEmail,
        id: `usr-${Date.now()}`,
        name: normalizedName,
        role,
        status: "Password change required",
        updatedAt: formatToday(),
      },
      ...current,
    ]);
    setName("");
    setEmail("");
    setRole("Analyst");
    setIsRoleMenuOpen(false);
    setFormError("");
  };

  const columns: TableColumn<UserRow>[] = [
    {
      header: "User",
      isRowHeader: true,
      key: "name",
      render: (row) => (
        <div className={style.userCell}>
          <span className={style.userName}>{row.name}</span>
          <span className={style.userEmailMobile}>{row.email}</span>
        </div>
      ),
      width: "20%",
    },
    {
      header: "Email",
      key: "email",
      render: (row) => <span className={style.emailCell}>{row.email}</span>,
      width: "24%",
    },
    {
      header: "Role",
      key: "role",
      render: (row) => <span className={style.roleBadge}>{row.role}</span>,
      width: "12%",
    },
    {
      header: "Status",
      key: "status",
      render: (row) => (
        <span
          className={`${style.statusBadge} ${
            row.status === "Password change required"
              ? style.statusWarning
              : style.statusActive
          }`}
        >
          {row.status}
        </span>
      ),
      width: "18%",
    },
    {
      header: "Updated",
      key: "updatedAt",
      render: (row) => <span className={style.updatedCell}>{row.updatedAt}</span>,
      width: "10%",
    },
    {
      header: "Actions",
      key: "actions",
      render: (row) => (
        <div className={style.actionGroup}>
          <button
            className={`${style.inlineAction} ${style.inlineActionPrimary}`}
            disabled={row.status === "Password change required"}
            onClick={() => requestPasswordChange(row.id)}
            type="button"
          >
            {row.status === "Password change required"
              ? "Requested"
              : "Request Password Change"}
          </button>
          <button
            className={`${style.inlineAction} ${style.inlineActionDanger}`}
            onClick={() => deleteUser(row.id)}
            type="button"
          >
            Delete
          </button>
        </div>
      ),
      width: "16%",
    },
  ];

  return (
    <DashboardLayout
      headerProfile={
        <DashboardProfileMenu
          activeCurrencyCode={"GBP" as PremiumCurrencyCode}
          activeMetricKey={"totalQuote" as TrendSeriesKey}
          availableBrands={brandFilterOptions}
          availableCountries={countryFilterOptions}
          availableCurrencies={currencyFilterOptions}
          availableMetrics={metricFilterOptions}
          availablePetTypes={petTypeFilterOptions}
          firstName={firstName}
          lastName={lastName}
          onActiveCurrencyChange={() => undefined}
          onActiveMetricChange={() => undefined}
          onBrandsChange={() => undefined}
          onCountriesChange={() => undefined}
          onManageUsers={() => navigate("/manage_users")}
          onLogout={logout}
          onPetTypesChange={() => undefined}
          onRunEtl={() => undefined}
          selectedBrands={[]}
          selectedCountries={[]}
          selectedPetTypes={[]}
          showFilterControls={false}
          showManageUsersControl={isAdmin}
          showRunEtlControl={false}
          userManagementActive
        />
      }
      menuItems={dashboardMenuItems}
      title="Manage Users"
    >
      <div className={style.root}>
        <div className={style.topGrid}>
          <Card className={style.formCard}>
            <div className={style.cardHeader}>
              <div>
                <p className={style.eyebrow}>Access Setup</p>
                <h2 className={style.title}>Add User</h2>
              </div>
              <p className={style.copy}>
                Create a new user, assign a role, and force a password change on
                first access.
              </p>
            </div>

            <form className={style.form} onSubmit={handleAddUser}>
              <label className={style.field}>
                <span className={style.fieldLabel}>Full Name</span>
                <input
                  className={style.input}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter full name"
                  type="text"
                  value={name}
                />
              </label>

              <label className={style.field}>
                <span className={style.fieldLabel}>Email</span>
                <input
                  className={style.input}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  type="email"
                  value={email}
                />
              </label>

              <div className={style.field}>
                <span className={style.fieldLabel}>Role</span>
                <div className={style.selectField} ref={roleMenuRef}>
                  <button
                    aria-expanded={isRoleMenuOpen}
                    aria-haspopup="listbox"
                    className={style.selectTrigger}
                    onClick={() => setIsRoleMenuOpen((current) => !current)}
                    type="button"
                  >
                    <span className={style.selectValue}>{role}</span>
                    <FaAngleDown
                      aria-hidden="true"
                      className={`${style.selectIcon} ${
                        isRoleMenuOpen ? style.selectIconOpen : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`${style.selectMenu} ${
                      isRoleMenuOpen ? style.selectMenuOpen : ""
                    }`}
                    role="listbox"
                  >
                    {roleOptions.map((option) => {
                      const isActive = option === role;

                      return (
                        <button
                          aria-selected={isActive}
                          className={`${style.selectOption} ${
                            isActive ? style.selectOptionActive : ""
                          }`}
                          key={option}
                          onClick={() => {
                            setRole(option);
                            setIsRoleMenuOpen(false);
                          }}
                          role="option"
                          type="button"
                        >
                          <span>{option}</span>
                          {isActive ? (
                            <FaCheck
                              aria-hidden="true"
                              className={style.selectOptionCheck}
                            />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {formError ? <p className={style.formError}>{formError}</p> : null}

              <div className={style.formActions}>
                <button className={style.primaryButton} type="submit">
                  Add User
                </button>
              </div>
            </form>
          </Card>

          <Card className={style.summaryCard}>
            <div className={style.cardHeader}>
              <div>
                <p className={style.eyebrow}>Access Summary</p>
                <h2 className={style.title}>User Access</h2>
              </div>
              <p className={style.copy}>
                Review the size of the access list and where password-change
                requests are currently outstanding.
              </p>
            </div>

            <div className={style.summaryGrid}>
              <div className={style.summaryMetric}>
                <span className={style.summaryLabel}>Total Users</span>
                <strong className={style.summaryValue}>{users.length}</strong>
              </div>
              <div className={style.summaryMetric}>
                <span className={style.summaryLabel}>Admins</span>
                <strong className={style.summaryValue}>{totalAdmins}</strong>
              </div>
              <div className={style.summaryMetric}>
                <span className={style.summaryLabel}>Password Requests</span>
                <strong className={style.summaryValue}>{passwordRequests}</strong>
              </div>
            </div>
          </Card>
        </div>

        <Card className={style.tableCard}>
          <div className={style.tableHeader}>
            <div>
              <p className={style.eyebrow}>Access Register</p>
              <h2 className={style.tableTitle}>Users and Roles</h2>
            </div>
          </div>

          <Table
            className={style.tableRegion}
            columns={columns}
            layout="fixed"
            minWidth="72rem"
            mobileMinWidth="72rem"
            rowKey={(row) => row.id}
            rows={users}
            size="small"
            stickySpacerWidth="0.55rem"
          />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ManageUsers;
