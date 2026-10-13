import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Alert, Modal, PasswordInput } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { RiAlertLine, RiLockPasswordLine } from "react-icons/ri";
import Card from "../components/ui/card/Card";
import Table, { type TableColumn } from "../components/ui/table/Table";
import DashboardLayout from "../components/layout/DashboardLayout/DashboardLayout";
import DashboardProfileMenu from "../components/ui/dashboard_profile_menu/DashboardProfileMenu";
import V2EtlModal from "../components/ui/etl_modal/V2EtlModal";
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
import { useAuth } from "../context/AuthContext";
import { useV2EtlRunner } from "../features/etl/useV2EtlRunner";
import {
  authService,
  type AuthUser,
  type AuthUserRole,
} from "../services/auth";
import { getUserNameParts } from "../utils/auth";
import style from "./page_css/ManageUsers.module.css";

const roleLabels: Record<AuthUserRole, string> = {
  mis: "MIS",
  admin: "Admin",
  super_admin: "SuperAdmin",
  marketing: "Marketing",
  biz_dev: "BizDev",
  exec_user: "ExecUser",
};

const allRoleOptions: AuthUserRole[] = [
  "mis",
  "admin",
  "super_admin",
  "marketing",
  "biz_dev",
  "exec_user",
];
const adminVisibleRoleOptions: AuthUserRole[] = [
  "mis",
  "marketing",
  "biz_dev",
  "exec_user",
];

const roleHasDefaultEtlAccess = (role: AuthUserRole) =>
  role === "admin" || role === "super_admin";

const passwordStyles = {
  input: {
    background: "rgba(255, 255, 255, 0.035)",
    border: "1px solid rgba(107, 99, 117, 0.18)",
    color: "#f5f7ff",
    minHeight: "2.9rem",
  },
  label: {
    color: "rgba(203, 211, 230, 0.76)",
    fontSize: "0.74rem",
    fontWeight: 600,
  },
};

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "Not yet";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const sortUsers = (users: AuthUser[]) =>
  [...users].sort((left, right) =>
    left.full_name.localeCompare(right.full_name, undefined, {
      sensitivity: "base",
    }),
  );

const ManageUsers: React.FC = () => {
  const navigate = useNavigate();
  const {
    canRunEtl: currentUserCanRunEtl,
    isAdmin,
    isSuperAdmin,
    logout,
    user,
  } = useAuth();
  const etlRunner = useV2EtlRunner();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<AuthUserRole>("exec_user");
  const [canRunEtl, setCanRunEtl] = useState(false);
  const [formError, setFormError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<AuthUserRole>("exec_user");
  const [editCanRunEtl, setEditCanRunEtl] = useState(false);
  const [editError, setEditError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingUser, setDeletingUser] = useState<AuthUser | null>(null);


  const roleOptions = isSuperAdmin ? allRoleOptions : adminVisibleRoleOptions;
  const etlUsers = useMemo(
    () => users.filter((entry) => entry.can_run_etl).length,
    [users],
  );
  const passwordRequests = useMemo(
    () => users.filter((entry) => entry.must_change_password).length,
    [users],
  );
  const { firstName, lastName } = getUserNameParts(user);

  useEffect(() => {
    let isActive = true;

    void authService
      .listUsers()
      .then((systemUsers) => {
        if (isActive) {
          setUsers(sortUsers(systemUsers));
        }
      })
      .catch((error) => {
        if (isActive) {
          setPageError(
            error instanceof Error
              ? error.message
              : "Unable to load system users.",
          );
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);


  const canManage = (target: AuthUser) => {
    if (!user || target.id === user.id) {
      return false;
    }
    if (isSuperAdmin) {
      return true;
    }
    return (
      user.role === "admin" &&
      !["admin", "super_admin"].includes(target.role)
    );
  };

  const replaceUser = (updatedUser: AuthUser) => {
    setUsers((current) =>
      sortUsers(
        current.map((entry) =>
          entry.id === updatedUser.id ? updatedUser : entry,
        ),
      ),
    );
  };

  const handleAddUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    setFormError("");
    setNotice("");

    if (!normalizedName || !normalizedEmail) {
      setFormError("Full name and email are required.");
      return;
    }
    if (password.length < 8) {
      setFormError("The temporary password must contain at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Temporary password confirmation does not match.");
      return;
    }

    setIsCreating(true);
    try {
      const createdUser = await authService.createUser({
        can_run_etl: canRunEtl,
        email: normalizedEmail,
        full_name: normalizedName,
        password,
        role,
      });
      setUsers((current) => sortUsers([...current, createdUser]));
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRole("exec_user");
      setCanRunEtl(false);
      setNotice(
        `${createdUser.full_name} was created and must change their password at first sign-in.`,
      );
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to create the user.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (target: AuthUser) => {
    setEditingUser(target);
    setEditName(target.full_name);
    setEditEmail(target.email);
    setEditRole(target.role);
    setEditCanRunEtl(target.can_run_etl);
    setEditError("");
  };

  const handleUpdateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUser) {
      return;
    }

    setEditError("");
    setNotice("");
    setIsUpdating(true);
    try {
      const updatedUser = await authService.updateUser(editingUser.id, {
        can_run_etl: editCanRunEtl,
        email: editEmail.trim().toLowerCase(),
        full_name: editName.trim(),
        role: editRole,
      });
      replaceUser(updatedUser);
      setEditingUser(null);
      setNotice(`${updatedUser.full_name}'s account was updated.`);
    } catch (error) {
      setEditError(
        error instanceof Error ? error.message : "Unable to update the user.",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChangeRequest = async (target: AuthUser) => {
    setBusyUserId(target.id);
    setPageError("");
    setNotice("");
    try {
      const updatedUser = await authService.requestPasswordChange(target.id);
      replaceUser(updatedUser);
      setNotice(
        `${updatedUser.full_name} must change their password at next sign-in.`,
      );
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Unable to request a password change.",
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) {
      return;
    }

    const target = deletingUser;
    setBusyUserId(target.id);
    setPageError("");
    setNotice("");
    try {
      await authService.deleteUser(target.id);
      setUsers((current) => current.filter((entry) => entry.id !== target.id));
      setDeletingUser(null);
      setNotice(`${target.full_name} was removed from the system.`);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Unable to delete the user.",
      );
    } finally {
      setBusyUserId(null);
    }
  };

  const columns: TableColumn<AuthUser>[] = [
    {
      header: "User",
      isRowHeader: true,
      key: "user",
      render: (row) => (
        <div className={style.userCell}>
          <span className={style.userName}>
            {row.full_name}
            {row.id === user?.id ? (
              <span className={style.currentUserLabel}>You</span>
            ) : null}
          </span>
          <span className={style.userEmail}>{row.email}</span>
        </div>
      ),
      width: "21%",
    },
    {
      header: "Role",
      key: "role",
      render: (row) => (
        <span
          className={`${style.roleBadge} ${
            row.role === "super_admin" ? style.superAdminBadge : ""
          }`}
        >
          {roleLabels[row.role]}
        </span>
      ),
      width: "10%",
    },
    {
      header: "RUN ETL",
      key: "etl",
      render: (row) => (
        <span
          className={`${style.statusBadge} ${
            row.can_run_etl ? style.statusActive : style.statusMuted
          }`}
        >
          {row.can_run_etl ? "Allowed" : "Not allowed"}
        </span>
      ),
      width: "10%",
    },
    {
      header: "Password Status",
      key: "status",
      render: (row) => (
        <span
          className={`${style.statusBadge} ${
            row.must_change_password ? style.statusWarning : style.statusActive
          }`}
        >
          {row.must_change_password ? "Change required" : "Current"}
        </span>
      ),
      width: "14%",
    },
    {
      header: "Created",
      key: "created",
      render: (row) => (
        <span className={style.dateCell}>{formatDate(row.created_at)}</span>
      ),
      width: "10%",
    },
    {
      header: "Last Updated",
      key: "updated",
      render: (row) => (
        <span className={style.dateCell}>
          {formatDate(row.updated_at ?? row.password_changed_at)}
        </span>
      ),
      width: "10%",
    },
    {
      header: "Actions",
      key: "actions",
      render: (row) => {
        const isManageable = canManage(row);
        if (!isManageable) {
          return (
            <span className={style.restrictedLabel}>
              {row.id === user?.id ? "Current account" : "SuperAdmin only"}
            </span>
          );
        }

        const isBusy = busyUserId === row.id;
        return (
          <div className={style.actionGroup}>
            <button
              className={style.inlineAction}
              disabled={isBusy}
              onClick={() => openEditModal(row)}
              type="button"
            >
              Edit
            </button>
            <button
              className={`${style.inlineAction} ${style.inlineActionPrimary}`}
              disabled={row.must_change_password || isBusy}
              onClick={() => void handlePasswordChangeRequest(row)}
              type="button"
            >
              {row.must_change_password ? "Requested" : "Request change"}
            </button>
            <button
              className={`${style.inlineAction} ${style.inlineActionDanger}`}
              disabled={isBusy}
              onClick={() => setDeletingUser(row)}
              type="button"
            >
              Delete
            </button>
          </div>
        );
      },
      width: "25%",
    },
  ];

  return (
    <>
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
          isEtlRunning={etlRunner.isEtlRunning}
          lastName={lastName}
          onActiveCurrencyChange={() => undefined}
          onActiveMetricChange={() => undefined}
          onBrandsChange={() => undefined}
          onCountriesChange={() => undefined}
          onManageUsers={() => navigate("/manage_users")}
          onLogout={logout}
          onPetTypesChange={() => undefined}
          onRunEtl={etlRunner.openModal}
          selectedBrands={[]}
          selectedCountries={[]}
          selectedPetTypes={[]}
          showFilterControls={false}
          showManageUsersControl={isAdmin}
          showRunEtlControl={currentUserCanRunEtl}
          userManagementActive
        />
      }
      menuItems={dashboardMenuItems}
      showDownloadControl={false}
      showReportingPeriodControl={false}
      title="Manage Users"
    >
      <div className={style.root}>
        {pageError ? (
          <Alert color="red" icon={<RiAlertLine />} radius="lg" variant="light">
            {pageError}
          </Alert>
        ) : null}
        {notice ? (
          <div className={style.notice} role="status">
            {notice}
          </div>
        ) : null}

        <div className={style.topGrid}>
          <Card className={style.formCard}>
            <div className={style.cardHeader}>
              <div>
                <p className={style.eyebrow}>Access Setup</p>
                <h2 className={style.title}>Add User</h2>
              </div>
              <p className={style.copy}>
                Set a temporary password. The user must replace it at first
                sign-in.
              </p>
            </div>

            <form className={style.form} onSubmit={handleAddUser}>
              <div className={style.formGrid}>
                <label className={style.field}>
                  <span className={style.fieldLabel}>Full Name</span>
                  <input
                    className={style.input}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter full name"
                    required
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
                    required
                    type="email"
                    value={email}
                  />
                </label>

                <PasswordInput
                  autoComplete="new-password"
                  label="Temporary Password"
                  leftSection={<RiLockPasswordLine />}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  placeholder="Minimum 8 characters"
                  required
                  styles={passwordStyles}
                  value={password}
                />

                <PasswordInput
                  autoComplete="new-password"
                  label="Confirm Temporary Password"
                  leftSection={<RiLockPasswordLine />}
                  onChange={(event) =>
                    setConfirmPassword(event.currentTarget.value)
                  }
                  placeholder="Re-enter temporary password"
                  required
                  styles={passwordStyles}
                  value={confirmPassword}
                />

                <label className={style.field}>
                  <span className={style.fieldLabel}>Role</span>
                  <select
                    className={style.input}
                    onChange={(event) => {
                      const nextRole = event.target.value as AuthUserRole;
                      setRole(nextRole);
                      setCanRunEtl(roleHasDefaultEtlAccess(nextRole));
                    }}
                    value={role}
                  >
                    {roleOptions.map((option) => (
                      <option key={option} value={option}>
                        {roleLabels[option]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={style.permissionField}>
                  <input
                    checked={canRunEtl}
                    onChange={(event) => setCanRunEtl(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    <strong>RUN ETL</strong>
                    <small>
                      Grant or revoke this permission independently of the role.
                    </small>
                  </span>
                </label>
              </div>

              {formError ? <p className={style.formError}>{formError}</p> : null}

              <div className={style.formActions}>
                <button
                  className={style.primaryButton}
                  disabled={isCreating}
                  type="submit"
                >
                  {isCreating ? "Creating..." : "Add User"}
                </button>
              </div>
            </form>
          </Card>

          <Card className={style.summaryCard}>
            <div className={style.cardHeader}>
              <div>
                <p className={style.eyebrow}>Access Summary</p>
                <h2 className={style.title}>System Accounts</h2>
              </div>
              <p className={style.copy}>
                Every account stored in the application user table is included
                below.
              </p>
            </div>

            <div className={style.summaryGrid}>
              <div className={style.summaryMetric}>
                <span className={style.summaryLabel}>Total Users</span>
                <strong className={style.summaryValue}>{users.length}</strong>
              </div>
              <div className={style.summaryMetric}>
                <span className={style.summaryLabel}>ETL Access</span>
                <strong className={style.summaryValue}>{etlUsers}</strong>
              </div>
              <div className={style.summaryMetric}>
                <span className={style.summaryLabel}>Password Changes</span>
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
            <span className={style.tableCount}>
              {isLoading ? "Loading..." : `${users.length} accounts`}
            </span>
          </div>

          {isLoading ? (
            <div className={style.loadingState}>Loading system users...</div>
          ) : (
            <Table
              className={style.tableRegion}
              columns={columns}
              layout="fixed"
              minWidth="76rem"
              mobileMinWidth="76rem"
              rowKey={(row) => row.id}
              rows={users}
              size="small"
              stickySpacerWidth="0.55rem"
            />
          )}
        </Card>
      </div>

      <Modal
        centered
        classNames={{
          body: style.modalBody,
          content: style.modalContent,
          header: style.modalHeader,
          title: style.modalTitle,
        }}
        onClose={() => setEditingUser(null)}
        opened={Boolean(editingUser)}
        title="Edit User"
      >
        <form className={style.form} onSubmit={handleUpdateUser}>
          <label className={style.field}>
            <span className={style.fieldLabel}>Full Name</span>
            <input
              className={style.input}
              onChange={(event) => setEditName(event.target.value)}
              required
              type="text"
              value={editName}
            />
          </label>
          <label className={style.field}>
            <span className={style.fieldLabel}>Email</span>
            <input
              className={style.input}
              onChange={(event) => setEditEmail(event.target.value)}
              required
              type="email"
              value={editEmail}
            />
          </label>
          <label className={style.field}>
            <span className={style.fieldLabel}>Role</span>
            <select
              className={style.input}
              onChange={(event) => setEditRole(event.target.value as AuthUserRole)}
              value={editRole}
            >
              {roleOptions.map((option) => (
                <option key={option} value={option}>
                  {roleLabels[option]}
                </option>
              ))}
            </select>
          </label>
          <label className={style.permissionField}>
            <input
              checked={editCanRunEtl}
              onChange={(event) => setEditCanRunEtl(event.target.checked)}
              type="checkbox"
            />
            <span>
              <strong>RUN ETL</strong>
              <small>
                This user-specific setting can grant or revoke ETL access.
              </small>
            </span>
          </label>
          {editError ? <p className={style.formError}>{editError}</p> : null}
          <div className={style.modalActions}>
            <button
              className={style.secondaryButton}
              disabled={isUpdating}
              onClick={() => setEditingUser(null)}
              type="button"
            >
              Cancel
            </button>
            <button
              className={style.primaryButton}
              disabled={isUpdating}
              type="submit"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        centered
        classNames={{
          body: style.modalBody,
          content: style.modalContent,
          header: style.modalHeader,
          title: style.modalTitle,
        }}
        onClose={() => setDeletingUser(null)}
        opened={Boolean(deletingUser)}
        title="Delete User"
      >
        <p className={style.modalCopy}>
          Delete <strong>{deletingUser?.full_name}</strong> from the system? This
          immediately removes their access and cannot be undone.
        </p>
        <div className={style.modalActions}>
          <button
            className={style.secondaryButton}
            disabled={Boolean(busyUserId)}
            onClick={() => setDeletingUser(null)}
            type="button"
          >
            Cancel
          </button>
          <button
            className={style.dangerButton}
            disabled={Boolean(busyUserId)}
            onClick={() => void handleDeleteUser()}
            type="button"
          >
            {busyUserId ? "Deleting..." : "Delete User"}
          </button>
        </div>
      </Modal>
      </DashboardLayout>

      <V2EtlModal
        activeRouteOption={etlRunner.activeRouteOption}
        completedAt={etlRunner.completedAt}
        dateRange={etlRunner.dateRange}
        etlEvents={etlRunner.etlEvents}
        etlHeadline={etlRunner.etlHeadline}
        etlJobs={etlRunner.etlJobs}
        isOpen={etlRunner.isEtlModalOpen}
        isRunning={etlRunner.isEtlRunning}
        isStatusLoading={etlRunner.isStatusLoading}
        onClose={etlRunner.closeModal}
        onDateRangeChange={etlRunner.setDateRange}
        onResetDateRange={etlRunner.resetDateRange}
        onResetState={etlRunner.resetEtlState}
        onRun={() => void etlRunner.runSelectedEtl()}
        onSelectRoute={etlRunner.setSelectedRouteKey}
        routeOptions={etlRunner.routeOptions}
        selectedRouteKey={etlRunner.selectedRouteKey}
        startedAt={etlRunner.startedAt}
        statusError={etlRunner.statusError}
        statusSummary={etlRunner.statusSummary}
      />
    </>
  );
};

export default ManageUsers;
