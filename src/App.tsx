import type { ReactElement } from "react";
import { Anchor, Center, Loader, Paper, Stack, Text, Title } from "@mantine/core";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import AttritionDashboard from "./pages/QuoteDashboard";
import DailySalesReport from "./pages/DailySalesReport";
import FeaturePlaceholderDashboard from "./pages/FeaturePlaceholderDashboard";
import Login from "./pages/Login";
import ManageUsers from "./pages/ManageUsers";
import PolicyDashboard from "./pages/PolicyDashboard";
import Reports from "./pages/Reports";
import RoleMenuAccess from "./pages/RoleMenuAccess";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { getFirstAllowedMenuPath } from "./config/menuAccess";
import type { AuthMenuKey } from "./services/auth";

function LoadingPage() {
  return (
    <Center mih="100vh">
      <Loader color="indigo" size="lg" />
    </Center>
  );
}

function NotFoundPage() {
  return (
    <Center mih="100vh" px="md">
      <Paper p="xl" radius="lg" shadow="sm" withBorder>
        <Stack gap="sm" ta="center">
          <Text c="dimmed" fw={700} size="sm" tt="uppercase">
            404
          </Text>
          <Title order={1}>Page not found</Title>
          <Text c="dimmed" maw={420}>
            The route you requested is not defined in this application.
          </Text>
          <Anchor component={Link} fw={600} to="/">
            Return to login
          </Anchor>
        </Stack>
      </Paper>
    </Center>
  );
}

function AccessDeniedPage() {
  const { allowedMenuKeys, isAdmin } = useAuth();
  const destination =
    getFirstAllowedMenuPath(allowedMenuKeys) ??
    (isAdmin ? "/manage_users" : null);

  return (
    <Center mih="100vh" px="md">
      <Paper p="xl" radius="lg" shadow="sm" withBorder>
        <Stack gap="sm" ta="center">
          <Text c="dimmed" fw={700} size="sm" tt="uppercase">
            Access restricted
          </Text>
          <Title order={1}>No menu access</Title>
          <Text c="dimmed" maw={460}>
            Your role does not currently have access to this area. Contact a
            SuperAdmin if your responsibilities have changed.
          </Text>
          {destination ? (
            <Anchor component={Link} fw={600} to={destination}>
              Open an available area
            </Anchor>
          ) : null}
        </Stack>
      </Paper>
    </Center>
  );
}

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/" />;
  }

  return children;
}

function MenuRoute({
  children,
  menuKey,
}: {
  children: ReactElement;
  menuKey: AuthMenuKey;
}) {
  const { allowedMenuKeys, isAdmin, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/" />;
  }

  if (!allowedMenuKeys.includes(menuKey)) {
    const destination =
      getFirstAllowedMenuPath(allowedMenuKeys) ??
      (isAdmin ? "/manage_users" : "/access-denied");
    return <Navigate replace to={destination} />;
  }

  return children;
}

function AdminRoute({ children }: { children: ReactElement }) {
  const { allowedMenuKeys, isAdmin, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/" />;
  }

  if (!isAdmin) {
    return (
      <Navigate
        replace
        to={getFirstAllowedMenuPath(allowedMenuKeys) ?? "/access-denied"}
      />
    );
  }

  return children;
}

function PublicOnlyRoute({ children }: { children: ReactElement }) {
  const { allowedMenuKeys, isAdmin, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (isAuthenticated) {
    return (
      <Navigate
        replace
        to={
          getFirstAllowedMenuPath(allowedMenuKeys) ??
          (isAdmin ? "/manage_users" : "/access-denied")
        }
      />
    );
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/quote_dashboard"
        element={
          <MenuRoute menuKey="quote">
            <AttritionDashboard />
          </MenuRoute>
        }
      />
      <Route
        path="/manage_users"
        element={
          <AdminRoute>
            <ManageUsers />
          </AdminRoute>
        }
      />
      <Route
        path="/policy"
        element={
          <MenuRoute menuKey="policy">
            <PolicyDashboard />
          </MenuRoute>
        }
      />
      <Route
        path="/renewals"
        element={
          <MenuRoute menuKey="renewals">
            <FeaturePlaceholderDashboard
              description="Surface renewal pipeline, retention pressure, and upcoming renewal cohorts so teams can see where conversion and renewal risk are building."
              focusAreas={[
                "Renewal due pipeline",
                "Retention and save rate",
                "At-risk renewal cohorts",
              ]}
              note="Renewals should become the retention view that explains what portion of the book is being defended, saved, or lost."
              title="Renewals Dashboard"
            />
          </MenuRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <MenuRoute menuKey="reports">
            <Reports />
          </MenuRoute>
        }
      />
      <Route
        path="/dsr"
        element={
          <MenuRoute menuKey="dsr">
            <DailySalesReport />
          </MenuRoute>
        }
      />
      <Route
        path="/role_menu_access"
        element={
          <AdminRoute>
            <RoleMenuAccess />
          </AdminRoute>
        }
      />
      <Route
        path="/access-denied"
        element={
          <ProtectedRoute>
            <AccessDeniedPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
