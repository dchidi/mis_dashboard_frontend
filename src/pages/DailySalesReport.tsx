import FeaturePlaceholderDashboard from "./FeaturePlaceholderDashboard";

const DailySalesReport: React.FC = () => (
  <FeaturePlaceholderDashboard
    description="The Daily Sales Report is being prepared and will provide a focused view of daily sales performance once complete."
    focusAreas={[
      "Daily sales totals and trends",
      "Country and brand performance",
      "Downloadable daily sales detail",
    ]}
    note="Access to this placeholder is controlled per role through Role Menu Access."
    statusLabel="Under Construction"
    title="Daily Sales Report"
  />
);

export default DailySalesReport;
