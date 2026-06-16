import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getCustomerProfile } from "../api/googleSheetApi";
import PaymentEvidence from "../components/PaymentEvidence";
import { getPaymentEvidence } from "../utils/paymentEvidence";

function CustomerProfile() {
  const { id } = useParams();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCustomerProfile();
  }, [id]);

  async function loadCustomerProfile() {
    try {
      setLoading(true);
      setError("");
      const data = await getCustomerProfile(id);
      setProfile(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
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

  if (loading) return <p>Loading customer profile...</p>;

  if (error) {
    return (
      <div>
        <p className="error-text">Error: {error}</p>
        <Link to="/customers" className="view-link">Back to Customers</Link>
      </div>
    );
  }

  if (!profile || !profile.customer) {
    return (
      <div>
        <p className="error-text">Customer profile not found.</p>
        <Link to="/customers" className="view-link">Back to Customers</Link>
      </div>
    );
  }

  const {
    customer,
    acUnits = [],
    installations = [],
    services = [],
    payments = [],
    complaints = [],
  } = profile;

  const customerId = getValue(customer, ["customer_ID", "Customer_ID", "Customer ID", "id"]);
  const customerName = getValue(customer, ["Customer_Name", "Customer Name", "name"]);
  const phone = getValue(customer, ["Phone", "phone"]);
  const email = getValue(customer, ["Email", "email"]);
  const address = getValue(customer, ["Address", "address"]);
  const googleMapLink = getValue(customer, ["Google_Map_Li", "Google_Map_Link", "Google Map Link", "googleMapLink"]);
  const createdDate = getValue(customer, ["Created_Date", "Created Date", "createdDate"]);
  const notes = getValue(customer, ["Notes", "notes"]);

  function getTotalQuantity(items) {
    return items.reduce((total, item) => total + Number(item.Quantity || 0), 0);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{customerName}</h2>
          <p>Full customer profile and service details.</p>
        </div>
        <Link to="/customers" className="view-link">← Back to Customers</Link>
      </div>

      {/* Customer info + warranty side by side */}
      <div className="profile-grid">
        <div className="info-card">
          <h3>Customer Details</h3>
          <p><strong>ID:</strong> {customerId}</p>
          <p><strong>Name:</strong> {customerName}</p>
          <p><strong>Phone:</strong> {phone}</p>
          <p><strong>Email:</strong> {email}</p>
          <p><strong>Address:</strong> {address}</p>
          <p>
            <strong>Google Map:</strong>{" "}
            {googleMapLink !== "-" ? (
              <a href={googleMapLink} target="_blank" rel="noreferrer" className="view-link">Open Map</a>
            ) : "—"}
          </p>
          <p><strong>Created Date:</strong> {formatDate(createdDate)}</p>
          {notes !== "-" && <p><strong>Notes:</strong> {notes}</p>}
        </div>

        <div className="info-card">
          <h3>Warranty Status</h3>
          {acUnits.length === 0 ? (
            <p>No AC units found.</p>
          ) : (
            acUnits.map((unit, index) => {
              const acId = getValue(unit, ["AC_ID", "ac_ID"]);
              return (
                <div key={acId !== "-" ? acId : index} className="warranty-item">
                  <p><strong>AC ID:</strong> {acId}</p>
                  <p><strong>Model:</strong> {getValue(unit, ["AC_Model"])}</p>
                  <p><strong>Serial:</strong> {getValue(unit, ["Serial_Number"])}</p>
                  <p><strong>Invoice:</strong> {getValue(unit, ["Invoice_Number", "Invoice Number"])}</p>
                  <p>
                    <strong>Warranty:</strong>{" "}
                    <span className={`status-badge ${getStatusClass(getValue(unit, ["Warranty_Status"]))}`}>
                      {getValue(unit, ["Warranty_Status"])}
                    </span>
                  </p>
                  <p><strong>Expires:</strong> {formatDate(getValue(unit, ["Warranty_End_Date"]))}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* AC Units */}
      <ProfileSection title="Purchased AC Units" count={getTotalQuantity(acUnits)}>
        {acUnits.map((unit, index) => (
          <div key={unit.AC_ID || index} className="record-card">
            <div className="record-card-main" style={{ cursor: "default" }}>
              <span className="record-id-badge">{unit.AC_ID || "—"}</span>
              <div className="record-summary">
                <div className="record-primary-row">
                  <span className="record-customer-id">{unit.AC_Model || "—"}</span>
                  <span className="record-separator">·</span>
                  <span className="record-ac-id">S/N: {unit.Serial_Number || "—"}</span>
                  <span className="record-separator">·</span>
                  <span className="record-amount">{formatPrice(unit.Price)}</span>
                  <span className="record-separator">·</span>
                  <span className="record-date">{formatDate(unit.Purchase_Date)}</span>
                </div>
                <div className="record-badge-row">
                  <span className={`status-badge ${getStatusClass(unit.Warranty_Status)}`}>
                    {unit.Warranty_Status || "—"}
                  </span>
                  {unit.Sales_Channel && <span className="status-neutral">{unit.Sales_Channel}</span>}
                  {unit.Quantity && <span className="status-neutral">Qty: {unit.Quantity}</span>}
                  {unit.Invoice_Number && (
                    <span className="status-neutral">Invoice: {unit.Invoice_Number}</span>
                  )}
                  <span className="record-date" style={{ fontSize: "12px", color: "#6B7280" }}>
                    Warranty: {formatDate(unit.Warranty_Start_Date)} – {formatDate(unit.Warranty_End_Date)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </ProfileSection>

      {/* Installations */}
      <ProfileSection title="Installation Details" count={installations.length}>
        {installations.map((inst, index) => (
          <div key={inst.Installation_ID || index} className="record-card">
            <div className="record-card-main" style={{ cursor: "default" }}>
              <span className="record-id-badge">{inst.Installation_ID || "—"}</span>
              <div className="record-summary">
                <div className="record-primary-row">
                  <span className="record-ac-id">AC: {inst.AC_ID || "—"}</span>
                  <span className="record-separator">·</span>
                  <span className="record-date">{formatDate(inst.Installation_Date)}</span>
                  {inst.Technician_Name && (
                    <>
                      <span className="record-separator">·</span>
                      <span className="record-tech">{inst.Technician_Name}</span>
                    </>
                  )}
                </div>
                <div className="record-badge-row">
                  <span className={`status-badge ${getInstallationStatusClass(inst.Installation_Status)}`}>
                    {inst.Installation_Status || "—"}
                  </span>
                  {inst.Installation_Type && (
                    <span className={`status-badge ${getInstallationTypeClass(inst.Installation_Type)}`}>
                      {inst.Installation_Type}
                    </span>
                  )}
                  <span className={`status-badge ${getInstallationTypeClass(inst.Technician_type)}`}>
                    Tech: {inst.Technician_type || "In-house"}
                  </span>
                  {inst.Outsource_Payment && (
                    <span className="status-neutral">{formatPrice(inst.Outsource_Payment)}</span>
                  )}
                  {inst.Installation_Payment_Date && (
                    <span className="status-neutral">
                      Paid {formatDate(inst.Installation_Payment_Date)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </ProfileSection>

      {/* Services */}
      <ProfileSection title="Service History" count={services.length}>
        {services.map((svc, index) => (
          <div key={svc.Service_ID || index} className="record-card">
            <div className="record-card-main" style={{ cursor: "default" }}>
              <span className="record-id-badge">{svc.Service_ID || "—"}</span>
              <div className="record-summary">
                <div className="record-primary-row">
                  <span className="record-ac-id">AC: {svc.AC_ID || "—"}</span>
                  <span className="record-separator">·</span>
                  <span className="record-date">{formatDate(svc.Service_Date)}</span>
                  {svc.Technician_Name && (
                    <>
                      <span className="record-separator">·</span>
                      <span className="record-tech">{svc.Technician_Name}</span>
                    </>
                  )}
                </div>
                <div className="record-badge-row">
                  <span className={`status-badge ${getServiceStatusClass(svc.Service_Status)}`}>
                    {svc.Service_Status || "—"}
                  </span>
                  <span className={`status-badge ${getServiceTypeClass(svc.Service_Type)}`}>
                    {svc.Service_Type || "—"}
                  </span>
                  {svc.Service_Year && <span className="status-neutral">{svc.Service_Year}</span>}
                  {svc.Service_No && <span className="status-neutral">Service {svc.Service_No}</span>}
                  {svc.Service_Category && <span className="status-neutral">{svc.Service_Category}</span>}
                  <span className={`status-badge ${getTechnicianTypeClass(svc.Technician_Type)}`}>
                    Tech: {svc.Technician_Type || "In-house"}
                  </span>
                  {svc.Technician_Payment && (
                    <span className="status-neutral">
                      Tech Pay {formatPrice(svc.Technician_Payment)}
                    </span>
                  )}
                  {svc.Service_Completed_Date && (
                    <span className="status-neutral">
                      Completed {formatDate(svc.Service_Completed_Date)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </ProfileSection>

      {/* Payments */}
      <ProfileSection title="Payment History" count={payments.length}>
        {payments.map((pay, index) => {
          const evidence = getPaymentEvidence(pay);

          return (
            <div key={pay.Payment_ID || index} className="record-card">
              <div className="record-card-main" style={{ cursor: "default" }}>
                <span className="record-id-badge">{pay.Payment_ID || "—"}</span>
                <div className="record-summary">
                  <div className="record-primary-row">
                    <span className="record-ac-id">AC: {pay.AC_ID || "—"}</span>
                    <span className="record-separator">·</span>
                    <span className="record-amount">{formatPrice(pay.Amount)}</span>
                    <span className="record-separator">·</span>
                    <span className="record-date">Due: {formatDate(pay.Due_Date)}</span>
                    {pay.Payment_Date && (
                      <>
                        <span className="record-separator">·</span>
                        <span className="record-date">Paid: {formatDate(pay.Payment_Date)}</span>
                      </>
                    )}
                  </div>
                  <div className="record-badge-row">
                    <span className={`status-badge ${getPaymentStatusClass(pay.Payment_Status)}`}>
                      {pay.Payment_Status || "—"}
                    </span>
                    {pay.Payment_Type && (
                      <span className={`status-badge ${getPaymentTypeClass(pay.Payment_Type)}`}>
                        {pay.Payment_Type}
                      </span>
                    )}
                    {pay.Payment_Year && <span className="status-neutral">{pay.Payment_Year}</span>}
                    {evidence.hasEvidence && <span className="status-badge status-info">Evidence</span>}
                  </div>

                  {evidence.hasEvidence && (
                    <div className="profile-payment-evidence">
                      <strong>Payment Evidence</strong>
                      <PaymentEvidence evidence={evidence} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </ProfileSection>

      {/* Complaints */}
      <ProfileSection title="Complaints" count={complaints.length}>
        {complaints.map((comp, index) => (
          <div key={comp.Complaint_ID || index} className="record-card">
            <div className="record-card-main" style={{ cursor: "default" }}>
              <span className="record-id-badge">{comp.Complaint_ID || "—"}</span>
              <div className="record-summary">
                <div className="record-primary-row">
                  <span className="record-ac-id">AC: {comp.AC_ID || "—"}</span>
                  <span className="record-separator">·</span>
                  <span className="record-date">{formatDate(comp.Complaint_Date)}</span>
                  {comp.Technician_Name && (
                    <>
                      <span className="record-separator">·</span>
                      <span className="record-tech">{comp.Technician_Name}</span>
                    </>
                  )}
                </div>
                <div className="record-badge-row">
                  <span className={`status-badge ${getComplaintStatusClass(comp.Complaint_Status)}`}>
                    {comp.Complaint_Status || "—"}
                  </span>
                  <span className={`status-badge ${getCostTypeClass(comp.Cost_Type)}`}>
                    {comp.Cost_Type || "—"}
                  </span>
                  {comp.Issue_Description && (
                    <span className="record-issue-preview">
                      {comp.Issue_Description.substring(0, 70)}{comp.Issue_Description.length > 70 ? "…" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </ProfileSection>
    </div>
  );
}

function ProfileSection({ title, count, children }) {
  return (
    <div className="profile-section-card">
      <div className="profile-section-header">
        <h3>{title}</h3>
        <span className="profile-section-count">{count}</span>
      </div>
      {count === 0 ? (
        <p className="profile-section-empty">No records found.</p>
      ) : (
        <div className="record-list">{children}</div>
      )}
    </div>
  );
}

/* ── Formatters ── */
function formatDate(value) {
  if (!value || value === "-") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB");
}

function formatPrice(value) {
  if (!value || value === "-") return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return `Rs. ${n.toLocaleString("en-LK")}`;
}

/* ── Status helpers ── */
function getStatusClass(status) {
  if (!status) return "";
  const v = String(status).toLowerCase();
  if (v === "active") return "status-active";
  if (v === "cancelled") return "status-cancelled";
  if (v === "expired") return "status-expired";
  return "";
}

function getInstallationStatusClass(status) {
  if (!status) return "";
  const v = String(status).toLowerCase();
  if (v === "completed") return "status-active";
  if (v === "pending") return "status-expired";
  if (v === "cancelled") return "status-cancelled";
  return "";
}

function getInstallationTypeClass(type) {
  if (!type) return "";
  const v = String(type).toLowerCase();
  if (v === "in-house") return "status-active";
  if (v === "outsourced") return "status-expired";
  return "";
}

function getTechnicianTypeClass(type) {
  if (!type) return "status-active";
  const v = String(type).toLowerCase();
  if (v === "in-house") return "status-active";
  if (v === "outsourced") return "status-expired";
  return "";
}

function getServiceStatusClass(status) {
  if (!status) return "";
  const v = String(status).toLowerCase();
  if (v === "completed") return "status-active";
  if (v === "pending") return "status-expired";
  if (v === "rescheduled") return "status-info";
  if (v === "cancelled") return "status-cancelled";
  return "";
}

function getServiceTypeClass(type) {
  if (!type) return "";
  const v = String(type).toLowerCase();
  if (v === "free") return "status-active";
  if (v === "paid") return "status-info";
  return "";
}

function getPaymentStatusClass(status) {
  if (!status) return "";
  const v = String(status).toLowerCase();
  if (v === "paid") return "status-active";
  if (v === "pending") return "status-expired";
  return "";
}

function getPaymentTypeClass(type) {
  if (!type) return "";
  const v = String(type).toLowerCase();
  if (v === "annual service") return "status-info";
  if (v === "repair") return "status-expired";
  if (v === "installation") return "status-active";
  return "";
}

function getComplaintStatusClass(status) {
  if (!status) return "";
  const v = String(status).toLowerCase();
  if (v === "open") return "status-expired";
  if (v === "in progress") return "status-info";
  if (v === "completed") return "status-active";
  if (v === "cancelled") return "status-cancelled";
  return "";
}

function getCostTypeClass(type) {
  if (!type) return "";
  const v = String(type).toLowerCase();
  if (v === "free") return "status-active";
  if (v === "paid") return "status-info";
  return "";
}

export default CustomerProfile;
