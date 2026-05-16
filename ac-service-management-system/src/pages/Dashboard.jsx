import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  <div className="dashboard-page">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Service reminders, payment reminders, complaints, and warranty overview.</p>
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
          note="Current month pending services"
        />

        <StatCard
          title="Overdue Services"
          value={dashboardData.overdueServices}
          note="Previous months not completed"
        />

        <StatCard
          title="Pending Payments"
          value={dashboardData.pendingPayments}
          note="Waiting for payment"
        />

        <StatCard
          title="Overdue Payments"
          value={dashboardData.overduePayments}
          note="Due date passed"
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

      <ReminderSection
        title="Services Due This Month"
        description="Pending or rescheduled services scheduled for this month."
        type="service"
        data={dashboardData.servicesDueThisMonthList}
      />

      <ReminderSection
        title="Overdue Services"
        description="Previous month services that are still pending or rescheduled."
        type="service"
        data={dashboardData.overdueServicesList}
      />

      <ReminderSection
        title="Pending Payments"
        description="Customers who still need to complete payment."
        type="payment"
        data={dashboardData.pendingPaymentsList}
      />

      <ReminderSection
        title="Overdue Payments"
        description="Pending payments where the due date has already passed."
        type="payment"
        data={dashboardData.overduePaymentsList}
      />

      <ReminderSection
        title="Open Complaints"
        description="Complaints that are open or currently in progress."
        type="complaint"
        data={dashboardData.openComplaintsList}
      />
    </div>
  );
}

function ReminderSection({ title, description, type, data = [] }) {
  return (
    <div className="table-card reminder-section">
      <div className="reminder-header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>

        <span className="reminder-count">{data.length}</span>
      </div>

      {data.length === 0 ? (
        <p className="empty-reminder">No records found.</p>
      ) : (
        <table>
          <thead>
            {type === "service" && (
              <tr>
                <th>Service ID</th>
                <th>Customer</th>
                <th>AC ID</th>
                <th>Service Date</th>
                <th>Type</th>
                <th>Status</th>
                <th>Technician</th>
                <th>Profile</th>
              </tr>
            )}

            {type === "payment" && (
              <tr>
                <th>Payment ID</th>
                <th>Customer</th>
                <th>AC ID</th>
                <th>Year</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Profile</th>
              </tr>
            )}

            {type === "complaint" && (
              <tr>
                <th>Complaint ID</th>
                <th>Customer</th>
                <th>AC ID</th>
                <th>Date</th>
                <th>Issue</th>
                <th>Status</th>
                <th>Technician</th>
                <th>Profile</th>
              </tr>
            )}
          </thead>

          <tbody>
            {data.map((item, index) => {
              if (type === "service") {
                return (
                  <tr key={item.Service_ID || index}>
                    <td>{item.Service_ID || "-"}</td>
                    <td>{item.Customer_ID} - {item.Customer_Name}</td>
                    <td>{item.AC_ID || "-"}</td>
                    <td>{formatDate(item.Service_Date)}</td>
                    <td>{item.Service_Type || "-"}</td>
                    <td>
                      <span className={`status-badge ${getServiceStatusClass(item.Service_Status)}`}>
                        {item.Service_Status || "-"}
                      </span>
                    </td>
                    <td>{item.Technician_Name || "-"}</td>
                    <td>
                      <Link className="view-link" to={`/customers/${item.Customer_ID}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                );
              }

              if (type === "payment") {
                return (
                  <tr key={item.Payment_ID || index}>
                    <td>{item.Payment_ID || "-"}</td>
                    <td>{item.Customer_ID} - {item.Customer_Name}</td>
                    <td>{item.AC_ID || "-"}</td>
                    <td>{item.Payment_Year || "-"}</td>
                    <td>{formatPrice(item.Amount)}</td>
                    <td>{item.Payment_Type || "-"}</td>
                    <td>
                      <span className={`status-badge ${getPaymentStatusClass(item.Payment_Status)}`}>
                        {item.Payment_Status || "-"}
                      </span>
                    </td>
                    <td>{formatDate(item.Due_Date)}</td>
                    <td>
                      <Link className="view-link" to={`/customers/${item.Customer_ID}`}>
                        View
                      </Link>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={item.Complaint_ID || index}>
                  <td>{item.Complaint_ID || "-"}</td>
                  <td>{item.Customer_ID} - {item.Customer_Name}</td>
                  <td>{item.AC_ID || "-"}</td>
                  <td>{formatDate(item.Complaint_Date)}</td>
                  <td>{item.Issue_Description || "-"}</td>
                  <td>
                    <span className={`status-badge ${getComplaintStatusClass(item.Complaint_Status)}`}>
                      {item.Complaint_Status || "-"}
                    </span>
                  </td>
                  <td>{item.Technician_Name || "-"}</td>
                  <td>
                    <Link className="view-link" to={`/customers/${item.Customer_ID}`}>
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-GB");
}

function formatPrice(value) {
  if (!value) return "-";

  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return String(value);

  return `Rs. ${numberValue.toLocaleString("en-LK")}`;
}

function getServiceStatusClass(status) {
  if (!status) return "";

  const value = String(status).toLowerCase();

  if (value === "completed") return "status-active";
  if (value === "pending") return "status-expired";
  if (value === "rescheduled") return "status-info";
  if (value === "cancelled") return "status-cancelled";

  return "";
}

function getPaymentStatusClass(status) {
  if (!status) return "";

  const value = String(status).toLowerCase();

  if (value === "paid") return "status-active";
  if (value === "pending") return "status-expired";

  return "";
}

function getComplaintStatusClass(status) {
  if (!status) return "";

  const value = String(status).toLowerCase();

  if (value === "open") return "status-expired";
  if (value === "in progress") return "status-info";
  if (value === "completed") return "status-active";
  if (value === "cancelled") return "status-cancelled";

  return "";
}

export default Dashboard;