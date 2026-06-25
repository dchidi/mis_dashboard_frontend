import type { ReactElement } from "react";
import { Anchor, Center, Loader, Paper, Stack, Text, Title } from "@mantine/core";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import AttritionDashboard from "./pages/QuoteDashboard";
import FeaturePlaceholderDashboard from "./pages/FeaturePlaceholderDashboard";
import Login from "./pages/Login";
import ManageUsers from "./pages/ManageUsers";
import PolicyDashboard from "./pages/PolicyDashboard";
import Reports from "./pages/Reports";
import { AuthProvider, useAuth } from "./context/AuthContext";

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

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Center mih="100vh">
        <Loader color="indigo" size="lg" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/" />;
  }

  return children;
}

function AdminRoute({ children }: { children: ReactElement }) {
  const { isAdmin, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Center mih="100vh">
        <Loader color="indigo" size="lg" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/" />;
  }

  if (!isAdmin) {
    return <Navigate replace to="/quote_dashboard" />;
  }

  return children;
}

function PublicOnlyRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Center mih="100vh">
        <Loader color="indigo" size="lg" />
      </Center>
    );
  }

  if (isAuthenticated) {
    return <Navigate replace to="/quote_dashboard" />;
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
          <ProtectedRoute>
            <AttritionDashboard />
          </ProtectedRoute>
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
          <ProtectedRoute>
            <PolicyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/renewals"
        element={
          <ProtectedRoute>
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
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
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
