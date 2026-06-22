import { Anchor, Center, Paper, Stack, Text, Title } from "@mantine/core";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import AttritionDashboard from "./pages/QuoteDashboard";
import FeaturePlaceholderDashboard from "./pages/FeaturePlaceholderDashboard";
import Login from "./pages/Login";
import ManageUsers from "./pages/ManageUsers";
import PolicyDashboard from "./pages/PolicyDashboard";
import Reports from "./pages/Reports";

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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/quote_dashboard" element={<AttritionDashboard />} />
        <Route path="/manage_users" element={<ManageUsers />} />
        <Route path="/policy" element={<PolicyDashboard />} />
        <Route
          path="/renewals"
          element={
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
          }
        />
        <Route
          path="/reports"
          element={<Reports />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
