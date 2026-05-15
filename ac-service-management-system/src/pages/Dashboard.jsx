import StatCard from "../components/StatCard";
import {
  customers,
  acUnits,
  services,
  payments,
  complaints,
} from "../data/dummyData";

function Dashboard() {
  const totalCustomers = customers.length;

  const servicesDueThisMonth = services.filter(
    (s) => s.status === "Due"
  ).length;

  const overdueServices = services.filter(
    (s) => s.status === "Overdue"
  ).length;

  const pendingPayments = payments.filter(
    (p) => p.status === "Pending"
  ).length;

  const activeWarranties = acUnits.filter(
    (u) => u.warrantyStatus === "Active"
  ).length;

  const openComplaints = complaints.filter(
    (c) => c.status === "Open"
  ).length;

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>{today}</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Customers"
          value={totalCustomers}
          note="Registered customers"
          color="blue"
        />
        <StatCard
          title="Services Due"
          value={servicesDueThisMonth}
          note="This month"
          color="amber"
        />
        <StatCard
          title="Overdue Services"
          value={overdueServices}
          note="Need urgent action"
          color="red"
        />
        <StatCard
          title="Pending Payments"
          value={pendingPayments}
          note="Awaiting payment"
          color="amber"
        />
        <StatCard
          title="Active Warranties"
          value={activeWarranties}
          note="Currently valid"
          color="green"
        />
        <StatCard
          title="Open Complaints"
          value={openComplaints}
          note="Need support"
          color="red"
        />
      </div>

      <div className="dashboard-section">
        <h3>Today's Focus</h3>

        <div className="focus-list">
          <div className="focus-item">
            <div className="focus-icon red">⚠️</div>
            <div>
              <strong>Check overdue services</strong>
              <p>Contact customers with overdue services and arrange a service date.</p>
            </div>
          </div>

          <div className="focus-item">
            <div className="focus-icon amber">💳</div>
            <div>
              <strong>Follow up on pending payments</strong>
              <p>Send payment reminders for the yearly service fee to all pending customers.</p>
            </div>
          </div>

          <div className="focus-item">
            <div className="focus-icon blue">💬</div>
            <div>
              <strong>Handle open complaints</strong>
              <p>Assign a technician for all unresolved customer complaints.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;