import { BrowserRouter, Routes, Route } from "react-router-dom";
import AttritionDashboard from "./pages/AttritionDashboard";
import FeaturePlaceholderDashboard from "./pages/FeaturePlaceholderDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AttritionDashboard />} />
        <Route
          path="/headcount"
          element={
            <FeaturePlaceholderDashboard
              description="Track how workforce size moves across the selected reporting period, where the shifts come from, and whether the organisation is building or losing capacity."
              focusAreas={[
                "Starting vs ending headcount",
                "Joins, transfers, and exits",
                "Critical team coverage",
              ]}
              note="Headcount should become the balance view that explains the base population behind every rate on the other dashboards."
              title="Headcount Analysis"
            />
          }
        />
        <Route
          path="/demographics"
          element={
            <FeaturePlaceholderDashboard
              description="Expose the workforce profile behind the headline numbers so leaders can see whether change is concentrated by gender, age band, tenure, or other meaningful segments."
              focusAreas={[
                "Gender and age distribution",
                "Tenure and grade mix",
                "Cross-segment movement",
              ]}
              note="Demographics should explain who makes up the workforce before attrition or absence conclusions are drawn."
              title="Demographics Analysis"
            />
          }
        />
        <Route
          path="/absence"
          element={
            <FeaturePlaceholderDashboard
              description="Surface attendance pressure early by tracking leave volume, absence rates, and hotspots that may later correlate with attrition or productivity loss."
              focusAreas={[
                "Days lost and absence rate",
                "Frequent short-term absence",
                "Business-unit hotspots",
              ]}
              note="Absence is strongest when paired with trend, trigger, and recurrence views rather than a single monthly total."
              title="Absence Analysis"
            />
          }
        />
        <Route
          path="/learning-development"
          element={
            <FeaturePlaceholderDashboard
              description="Show how capability investment is landing across the workforce, which groups are engaging, and whether completion patterns align with priority talent segments."
              focusAreas={[
                "Enrollment and completion",
                "Hours per employee",
                "Coverage by grade or function",
              ]}
              note="Learning metrics become more useful when tied to role criticality, promotion paths, and retention outcomes."
              title="Learning & Development"
            />
          }
        />
        <Route
          path="/planning"
          element={
            <FeaturePlaceholderDashboard
              description="Turn the dashboard shell into a forward-looking workspace for demand, hiring need, and risk-based workforce scenarios instead of only reporting historical movement."
              focusAreas={[
                "Demand vs supply forecast",
                "Gap and risk scenarios",
                "Succession pressure points",
              ]}
              note="Planning should become the synthesis layer that uses headcount, attrition, and skills signals to support action."
              title="Workforce Planning"
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
