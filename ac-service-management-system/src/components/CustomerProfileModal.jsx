import PaymentEvidence from "./PaymentEvidence";
import { getPaymentEvidence } from "../utils/paymentEvidence";

function CustomerProfileModal({ profile, onClose }) {
  const {
    customer,
    acUnits = [],
    installations = [],
    services = [],
    payments = [],
    complaints = [],
  } = profile || {};

  const customerId = getValue(customer, [
    "Customer_ID",
    "customer_ID",
    "Customer ID",
    "id",
  ]);
  const customerName = getValue(customer, [
    "Customer_Name",
    "Customer Name",
    "name",
  ]);
  const phone = getValue(customer, ["Phone", "phone"]);
  const email = getValue(customer, ["Email", "email"]);
  const address = getValue(customer, ["Address", "address"]);

  return (
    <div className="modal-overlay">
      <div className="modal-card dashboard-profile-modal">
        <div className="modal-header">
          <h3>{customerName}</h3>
          <button className="close-btn" onClick={onClose}>
            x
          </button>
        </div>

        <p className="modal-subtitle">
          {customerId} | {phone} | {email}
        </p>
        <p className="dashboard-profile-address">{address}</p>

        <DashboardProfileSection title="AC Units" count={acUnits.length}>
          {acUnits.map((unit, index) => (
            <MiniRecord key={unit.AC_ID || index} id={unit.AC_ID}>
              <span>{unit.AC_Model || "-"}</span>
              <span>{unit.Serial_Number || "-"}</span>
              <span
                className={`status-badge ${getWarrantyStatusClass(
                  unit.Warranty_Status
                )}`}
              >
                {unit.Warranty_Status || "-"}
              </span>
            </MiniRecord>
          ))}
        </DashboardProfileSection>

        <DashboardProfileSection
          title="Installations"
          count={installations.length}
        >
          {installations.map((item, index) => (
            <MiniRecord
              key={item.Installation_ID || index}
              id={item.Installation_ID}
            >
              <span>AC: {item.AC_ID || "-"}</span>
              <span>{formatDate(item.Installation_Date)}</span>
              {item.Installation_Payment_Date && (
                <span>Paid {formatDate(item.Installation_Payment_Date)}</span>
              )}
              <span>Tech: {item.Technician_type || "In-house"}</span>
              <span
                className={`status-badge ${getInstallationStatusClass(
                  item.Installation_Status
                )}`}
              >
                {item.Installation_Status || "-"}
              </span>
            </MiniRecord>
          ))}
        </DashboardProfileSection>

        <DashboardProfileSection title="Services" count={services.length}>
          {services.map((item, index) => (
            <MiniRecord key={item.Service_ID || index} id={item.Service_ID}>
              <span>AC: {item.AC_ID || "-"}</span>
              <span>{formatDate(item.Service_Date)}</span>
              <span>Tech: {item.Technician_Type || "In-house"}</span>
              {item.Technician_Payment && (
                <span>Tech Pay {formatPrice(item.Technician_Payment)}</span>
              )}
              {item.Service_Completed_Date && (
                <span>Completed {formatDate(item.Service_Completed_Date)}</span>
              )}
              <span
                className={`status-badge ${getServiceStatusClass(
                  item.Service_Status
                )}`}
              >
                {item.Service_Status || "-"}
              </span>
            </MiniRecord>
          ))}
        </DashboardProfileSection>

        <DashboardProfileSection title="Payments" count={payments.length}>
          {payments.map((item, index) => {
            const evidence = getPaymentEvidence(item);

            return (
              <MiniRecord key={item.Payment_ID || index} id={item.Payment_ID}>
                <span>{formatPrice(item.Amount)}</span>
                <span>{item.Payment_Type || "-"}</span>
                <span
                  className={`status-badge ${getPaymentStatusClass(
                    item.Payment_Status
                  )}`}
                >
                  {item.Payment_Status || "-"}
                </span>
                {evidence.hasEvidence && (
                  <div className="profile-payment-evidence">
                    <strong>Payment Evidence</strong>
                    <PaymentEvidence evidence={evidence} />
                  </div>
                )}
              </MiniRecord>
            );
          })}
        </DashboardProfileSection>

        <DashboardProfileSection title="Complaints" count={complaints.length}>
          {complaints.map((item, index) => (
            <MiniRecord
              key={item.Complaint_ID || index}
              id={item.Complaint_ID}
            >
              <span>AC: {item.AC_ID || "-"}</span>
              <span>{item.Issue_Description || "-"}</span>
              <span
                className={`status-badge ${getComplaintStatusClass(
                  item.Complaint_Status
                )}`}
              >
                {item.Complaint_Status || "-"}
              </span>
            </MiniRecord>
          ))}
        </DashboardProfileSection>
      </div>
    </div>
  );
}

function DashboardProfileSection({ title, count, children }) {
  return (
    <div className="dashboard-profile-section">
      <div className="dashboard-profile-section-header">
        <h4>{title}</h4>
        <span>{count}</span>
      </div>
      {count === 0 ? <p>No records found.</p> : <div>{children}</div>}
    </div>
  );
}

function MiniRecord({ id, children }) {
  return (
    <div className="dashboard-mini-record">
      <strong>{id || "-"}</strong>
      <div>{children}</div>
    </div>
  );
}

function getValue(row, keys) {
  if (!row) return "-";

  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key];
    }
  }

  return "-";
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

function getWarrantyStatusClass(status) {
  if (!status) return "";

  const value = String(status).toLowerCase();

  if (value === "active") return "status-active";
  if (value === "expired") return "status-expired";
  if (value === "cancelled") return "status-cancelled";

  return "";
}

function getInstallationStatusClass(status) {
  if (!status) return "";

  const value = String(status).toLowerCase();

  if (value === "completed") return "status-active";
  if (value === "pending") return "status-expired";
  if (value === "cancelled") return "status-cancelled";

  return "";
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

export default CustomerProfileModal;
