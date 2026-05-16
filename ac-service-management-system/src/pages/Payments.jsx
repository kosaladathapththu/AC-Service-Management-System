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
      setEditFormData((previousData) => ({
        ...previousData,
        Payment_Status: value,
        Payment_Date:
          value === "Paid" && !previousData.Payment_Date
            ? new Date().toISOString().split("T")[0]
            : previousData.Payment_Date,
      }));

      return;
    }

    setEditFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleUpdatePayment(event) {
    event.preventDefault();

    if (!editingPayment) return;

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      await updateRecord(
        "payments",
        "Payment_ID",
        editingPayment.Payment_ID,
        editFormData
      );

      setSuccessMessage("Payment updated successfully.");
      closeEditModal();
      await loadPayments();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendReminder(payment) {
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
        <p>Manage annual service, repair, and installation payments.</p>
      </div>

      {error && <p className="error-text">Error: {error}</p>}
      {successMessage && <p className="success-text">{successMessage}</p>}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Customer ID</th>
              <th>AC ID</th>
              <th>Payment Year</th>
              <th>Payment Date</th>
              <th>Amount</th>
              <th>Payment Type</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Notes</th>
              <th>Reminder Status</th>
              <th>Reminder Sent Date</th>
              <th>Reminder</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((payment, index) => (
              <tr key={payment.Payment_ID || index}>
                <td>{payment.Payment_ID || "-"}</td>
                <td>{payment.Customer_ID || "-"}</td>
                <td>{payment.AC_ID || "-"}</td>
                <td>{payment.Payment_Year || "-"}</td>
                <td>{formatDate(payment.Payment_Date)}</td>
                <td>{formatPrice(payment.Amount)}</td>

                <td>
                  <span
                    className={`status-badge ${getPaymentTypeClass(
                      payment.Payment_Type
                    )}`}
                  >
                    {payment.Payment_Type || "-"}
                  </span>
                </td>

                <td>
                  <span
                    className={`status-badge ${getPaymentStatusClass(
                      payment.Payment_Status
                    )}`}
                  >
                    {payment.Payment_Status || "-"}
                  </span>
                </td>

                <td>{formatDate(payment.Due_Date)}</td>
                <td>{payment.Notes || "-"}</td>

                <td>
                  <span
                    className={`status-badge ${
                      payment.Reminder_Status === "Sent"
                        ? "status-active"
                        : "status-expired"
                    }`}
                  >
                    {payment.Reminder_Status || "Not Sent"}
                  </span>
                </td>

                <td>{formatDate(payment.Reminder_Sent_Date)}</td>

                <td>
                  <button
                    className="reminder-btn"
                    onClick={() => handleSendReminder(payment)}
                    disabled={sendingReminderId === payment.Payment_ID}
                  >
                    {sendingReminderId === payment.Payment_ID
                      ? "Sending..."
                      : payment.Reminder_Status === "Sent"
                      ? "Resend"
                      : "Send"}
                  </button>
                </td>

                <td>
                  <button
                    className="edit-btn"
                    onClick={() => openEditModal(payment)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {payments.length === 0 && <p>No payment records found.</p>}
      </div>

      {editingPayment && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Payment</h3>
              <button className="close-btn" onClick={closeEditModal}>
                ×
              </button>
            </div>

            <p className="modal-subtitle">
              Payment ID: <strong>{editingPayment.Payment_ID}</strong>
            </p>

            <form onSubmit={handleUpdatePayment}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Payment Year</label>
                  <select
                    name="Payment_Year"
                    value={editFormData.Payment_Year}
                    onChange={handleEditChange}
                  >
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
                  <select
                    name="Payment_Type"
                    value={editFormData.Payment_Type}
                    onChange={handleEditChange}
                  >
                    <option value="Annual Service">Annual Service</option>
                    <option value="Repair">Repair</option>
                    <option value="Installation">Installation</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    name="Amount"
                    value={editFormData.Amount}
                    onChange={handleEditChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Payment Status</label>
                  <select
                    name="Payment_Status"
                    value={editFormData.Payment_Status}
                    onChange={handleEditChange}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Payment Date</label>
                  <input
                    type="date"
                    name="Payment_Date"
                    value={editFormData.Payment_Date}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    name="Due_Date"
                    value={editFormData.Due_Date}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    name="Notes"
                    value={editFormData.Notes}
                    onChange={handleEditChange}
                    rows="3"
                  ></textarea>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>

                <button type="submit" disabled={saving}>
                  {saving ? "Updating..." : "Update Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
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

function formatDateForInput(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().split("T")[0];
}

function formatPrice(value) {
  if (!value) return "-";

  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return String(value);

  return `Rs. ${numberValue.toLocaleString("en-LK")}`;
}

function getPaymentStatusClass(status) {
  if (!status) return "";

  const value = String(status).toLowerCase();

  if (value === "paid") return "status-active";
  if (value === "pending") return "status-expired";

  return "";
}

function getPaymentTypeClass(type) {
  if (!type) return "";

  const value = String(type).toLowerCase();

  if (value === "annual service") return "status-info";
  if (value === "repair") return "status-expired";
  if (value === "installation") return "status-active";

  return "";
}

export default Payments;