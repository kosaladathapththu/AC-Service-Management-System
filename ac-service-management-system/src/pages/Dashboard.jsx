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
    (service) => service.status === "Due"
  ).length;

  const overdueServices = services.filter(
    (service) => service.status === "Overdue"
  ).length;

  const pendingPayments = payments.filter(
    (payment) => payment.status === "Pending"
  ).length;

  const activeWarranties = acUnits.filter(
    (unit) => unit.warrantyStatus === "Active"
  ).length;

  const openComplaints = complaints.filter(
    (complaint) => complaint.status === "Open"
  ).length;

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Quick overview of customers, services, payments, and warranties.</p>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Customers"
          value={totalCustomers}
          note="Registered customers"
        />

        <StatCard
          title="Services Due This Month"
          value={servicesDueThisMonth}
          note="Need to schedule"
        />

        <StatCard
          title="Overdue Services"
          value={overdueServices}
          note="Need urgent action"
        />

        <StatCard
          title="Pending Payments"
          value={pendingPayments}
          note="Waiting for payment"
        />

        <StatCard
          title="Active Warranties"
          value={activeWarranties}
          note="Currently valid"
        />

        <StatCard
          title="Open Complaints"
          value={openComplaints}
          note="Need support team"
        />
      </div>

      <div className="dashboard-section">
        <h3>Today Focus</h3>

        <div className="focus-list">
          <div>
            <strong>Check overdue services</strong>
            <p>Contact customers and arrange service date.</p>
          </div>

          <div>
            <strong>Follow pending payments</strong>
            <p>Send payment reminder for yearly service fee.</p>
          </div>

          <div>
            <strong>Handle open complaints</strong>
            <p>Assign technician for unresolved complaints.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;