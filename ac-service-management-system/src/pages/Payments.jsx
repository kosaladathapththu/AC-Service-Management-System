import { useEffect, useState } from "react";
import {
  getAllData,
  updateRecord,
  sendManualReminder,
} from "../api/googleSheetApi";

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const [editingPayment, setEditingPayment] = useState(null);
  const [editFormData, setEditFormData] = useState({
    Payment_Year: "",
    Payment_Date: "",
    Amount: "",
    Payment_Type: "Annual Service",
    Payment_Status: "Pending",
    Due_Date: "",
    Notes: "",
  });

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    try {
      setLoading(true);
      setError("");
      const data = await getAllData("payments");
      setPayments(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(paymentId) {
    setExpandedId((prev) => (prev === paymentId ? null : paymentId));
  }

  function openEditModal(payment) {
    setEditingPayment(payment);
    setEditFormData({
      Payment_Year: payment.Payment_Year || "",
      Payment_Date: formatDateForInput(payment.Payment_Date),
      Amount: payment.Amount || "",
      Payment_Type: payment.Payment_Type || "Annual Service",
      Payment_Status: payment.Payment_Status || "Pending",
      Due_Date: formatDateForInput(payment.Due_Date),
      Notes: payment.Notes || "",
    });
  }

  function closeEditModal() {
    setEditingPayment(null);
    setEditFormData({
      Payment_Year: "",
      Payment_Date: "",
      Amount: "",
      Payment_Type: "Annual Service",
      Payment_Status: "Pending",
      Due_Date: "",
      Notes: "",
    });
  }

  function handleEditChange(event) {
    const { name, value } = event.target;
    if (name === "Payment_Status") {
      setEditFormData((prev) => ({
        ...prev,
        Payment_Status: value,
        Payment_Date:
          value === "Paid" && !prev.Payment_Date
            ? new Date().toISOString().split("T")[0]
            : prev.Payment_Date,
      }));
      return;
    }
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUpdatePayment(event) {
    event.preventDefault();
    if (!editingPayment) return;
    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");
      await updateRecord("payments", "Payment_ID", editingPayment.Payment_ID, editFormData);
      setSuccessMessage("Payment updated successfully.");
      closeEditModal();
      await loadPayments();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendReminder(payment, e) {
    e.stopPropagation();
    try {
      setSendingReminderId(payment.Payment_ID);
      setError("");
      setSuccessMessage("");
      await sendManualReminder("payment", payment.Payment_ID);
      setSuccessMessage("Payment reminder email sent successfully.");
      await loadPayments();
    } catch (error) {
      setError(error.message);
    } finally {
      setSendingReminderId("");
    }
  }

  if (loading) return <p>Loading payments...</p>;

  return (
    <div className="payments-page">
      <div className="page-header">
        <h2>Payments</h2>
        <p>Manage annual service, repair, and installation payments. Click a record to expand details.</p>
      </div>

      {error && <p className="error-text">Error: {error}</p>}
      {successMessage && <p className="success-text">{successMessage}</p>}

      <div className="record-list">
        {payments.length === 0 && <p className="empty-list">No payment records found.</p>}

        {payments.map((payment, index) => {
          const id = payment.Payment_ID || index;
          const isExpanded = expandedId === id;

          return (
            <div key={id} className="record-card">
              <div className="record-card-main" onClick={() => toggleExpand(id)}>
                <span className="record-id-badge">{payment.Payment_ID || "—"}</span>

                <div className="record-summary">
                  <div className="record-primary-row">
                    <span className="record-customer-id">{payment.Customer_ID || "—"}</span>
                    <span className="record-separator">·</span>
                    <span className="record-ac-id">AC: {payment.AC_ID || "—"}</span>
                    <span className="record-separator">·</span>
                    <span className="record-amount">{formatPrice(payment.Amount)}</span>
                    <span className="record-separator">·</span>
                    <span className="record-date">Due: {formatDate(payment.Due_Date)}</span>
                  </div>
                  <div className="record-badge-row">
                    <span className={`status-badge ${getPaymentStatusClass(payment.Payment_Status)}`}>
                      {payment.Payment_Status || "—"}
                    </span>
                    <span className={`status-badge ${getPaymentTypeClass(payment.Payment_Type)}`}>
                      {payment.Payment_Type || "—"}
                    </span>
                    {payment.Payment_Year && (
                      <span className="status-badge status-neutral">{payment.Payment_Year}</span>
                    )}
                  </div>
                </div>

                <div className="record-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="reminder-btn"
                    onClick={(e) => handleSendReminder(payment, e)}
                    disabled={sendingReminderId === payment.Payment_ID}
                  >
                    {sendingReminderId === payment.Payment_ID
                      ? "Sending..."
                      : payment.Reminder_Status === "Sent"
                      ? "Resend"
                      : "Send"}
                  </button>
                  <button className="edit-btn" onClick={() => openEditModal(payment)}>
                    Edit
                  </button>
                </div>

                <button className="expand-btn" aria-label="Expand record">
                  {isExpanded ? "▴" : "▾"}
                </button>
              </div>

              {isExpanded && (
                <div className="record-card-detail">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Payment Date</label>
                      <span>{formatDate(payment.Payment_Date)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Due Date</label>
                      <span>{formatDate(payment.Due_Date)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Payment Year</label>
                      <span>{payment.Payment_Year || "—"}</span>
                    </div>
                    <div className="detail-item">
                      <label>Reminder Status</label>
                      <span className={`status-badge ${payment.Reminder_Status === "Sent" ? "status-active" : "status-expired"}`}>
                        {payment.Reminder_Status || "Not Sent"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Reminder Sent Date</label>
                      <span>{formatDate(payment.Reminder_Sent_Date)}</span>
                    </div>
                    {payment.Notes && (
                      <div className="detail-item detail-full">
                        <label>Notes</label>
                        <span>{payment.Notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingPayment && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Payment</h3>
              <button className="close-btn" onClick={closeEditModal}>×</button>
            </div>
            <p className="modal-subtitle">
              Payment ID: <strong>{editingPayment.Payment_ID}</strong>
            </p>
            <form onSubmit={handleUpdatePayment}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Payment Year</label>
                  <select name="Payment_Year" value={editFormData.Payment_Year} onChange={handleEditChange}>
                    <option value="">Not applicable</option>
                    <option value="Year 1">Year 1</option>
                    <option value="Year 2">Year 2</option>
                    <option value="Year 3">Year 3</option>
                    <option value="Year 4">Year 4</option>
                    <option value="Year 5">Year 5</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Type</label>
                  <select name="Payment_Type" value={editFormData.Payment_Type} onChange={handleEditChange}>
                    <option value="Annual Service">Annual Service</option>
                    <option value="Repair">Repair</option>
                    <option value="Installation">Installation</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount</label>
                  <input type="number" name="Amount" value={editFormData.Amount} onChange={handleEditChange} min="0" />
                </div>
                <div className="form-group">
                  <label>Payment Status</label>
                  <select name="Payment_Status" value={editFormData.Payment_Status} onChange={handleEditChange}>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Date</label>
                  <input type="date" name="Payment_Date" value={editFormData.Payment_Date} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" name="Due_Date" value={editFormData.Due_Date} onChange={handleEditChange} />
                </div>
                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea name="Notes" value={editFormData.Notes} onChange={handleEditChange} rows="3"></textarea>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={closeEditModal}>Cancel</button>
                <button type="submit" disabled={saving}>{saving ? "Updating..." : "Update Payment"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB");
}

function formatDateForInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function formatPrice(value) {
  if (!value) return "—";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return `Rs. ${n.toLocaleString("en-LK")}`;
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

export default Payments;