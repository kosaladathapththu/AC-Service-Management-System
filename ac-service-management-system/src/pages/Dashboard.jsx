import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import { getDashboardData } from "../api/googleSheetApi";

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError("");

      const data = await getDashboardData();
      setDashboardData(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p>Loading dashboard data...</p>;
  }

  if (error) {
    return <p className="error-text">Error: {error}</p>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Quick overview of customers, services, payments, and warranties.</p>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Customers"
          value={dashboardData.totalCustomers}
          note="Registered customers"
        />

        <StatCard
          title="Services Due This Month"
          value={dashboardData.servicesDueThisMonth}
          note="Need to schedule"
        />

        <StatCard
          title="Overdue Services"
          value={dashboardData.overdueServices}
          note="Need urgent action"
        />

        <StatCard
          title="Pending Payments"
          value={dashboardData.pendingPayments}
          note="Waiting for payment"
        />

        <StatCard
          title="Active Warranties"
          value={dashboardData.activeWarranties}
          note="Currently valid"
        />

        <StatCard
          title="Open Complaints"
          value={dashboardData.openComplaints}
          note="Need support team"
        />
      </div>
    </div>
  );
}

export default Dashboard;