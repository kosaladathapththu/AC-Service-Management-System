import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getAllData,
  getCustomerProfile,
  updateRecord,
  sendManualReminder,
} from "../api/googleSheetApi";
import CustomerProfileModal from "../components/CustomerProfileModal";
import PaymentEvidence from "../components/PaymentEvidence";
import {
  formatCustomerDisplay,
  getRecordCustomerName,
} from "../utils/customerDisplay";
import { getPaymentEvidence } from "../utils/paymentEvidence";
import { hasAnnualServicePaymentForYear } from "../utils/paymentRules";
import { recordMatchesSearch } from "../utils/recordSearch";

function Payments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get("filter") || "all";

  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState("");
  const [markingPaidId, setMarkingPaidId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileLoadingId, setProfileLoadingId] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);

  const [editingPayment, setEditingPayment] = useState(null);
  const [editFormData, setEditFormData] = useState({
    Payment_Year: "",
    Payment_Date: "",
    Amount: "",
    Payment_Type: "Annual Service",
    Payment_Status: "Pending",
    Due_Date: "",
    Annual_Service_Count: "3",
    Notes: "",
  });

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    try {
      setLoading(true);
      setError("");

      const [paymentsData, customersData] = await Promise.all([
        getAllData("payments"),
        getAllData("customers"),
      ]);

      setPayments(paymentsData);
      setCustomers(customersData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function changeFilter(filterName) {
    setExpandedId(null);

    if (filterName === "all") {
      setSearchParams({});
      return;
    }

    setSearchParams({ filter: filterName });
  }

  const filteredPayments = payments.filter((payment) => {
    const status = String(payment.Payment_Status || "").toLowerCase();

    if (!paymentMatchesSearch(payment, customers, searchQuery)) return false;

    if (activeFilter === "pending") return status === "pending";
    if (activeFilter === "paid") return status === "paid";
    if (activeFilter === "overdue") {
      return status === "pending" && isPastDate(payment.Due_Date);
    }
    if (activeFilter === "annual-service") {
      return String(payment.Payment_Type || "").toLowerCase() === "annual service";
    }
    if (activeFilter === "repair") {
      return String(payment.Payment_Type || "").toLowerCase() === "repair";
    }
    if (activeFilter === "installation") {
      return String(payment.Payment_Type || "").toLowerCase() === "installation";
    }

    return true;
  });
  const paymentCustomerGroups = getPaymentCustomerGroups(filteredPayments, customers);

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
      Annual_Service_Count: payment.Annual_Service_Count || "3",
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
      Annual_Service_Count: "3",
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

    if (name === "Payment_Type") {
      setEditFormData((prev) => ({
        ...prev,
        Payment_Type: value,
        Annual_Service_Count:
          value === "Annual Service" ? prev.Annual_Service_Count || "3" : "",
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

      const updatedPayment = {
        ...editingPayment,
        ...editFormData,
      };

      if (
        hasAnnualServicePaymentForYear(
          payments,
          updatedPayment,
          editingPayment.Payment_ID
        )
      ) {
        setError(
          `${updatedPayment.Payment_Year} annual service payment already exists for this AC unit. Select another year.`
        );
        return;
      }

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

  async function handleSendReminder(payment, event) {
    event.stopPropagation();

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

  async function openProfileModal(customerId, event) {
    event.stopPropagation();

    if (!customerId || customerId === "-") return;

    try {
      setProfileLoadingId(customerId);
      setError("");
      const profile = await getCustomerProfile(customerId);
      setSelectedProfile(profile);
    } catch (error) {
      setError(error.message);
    } finally {
      setProfileLoadingId("");
    }
  }

  async function handleMarkPaid(payment, event) {
    event.stopPropagation();

    try {
      setMarkingPaidId(payment.Payment_ID);
      setError("");
      setSuccessMessage("");

      const updatedPayment = {
        ...payment,
        Payment_Status: "Paid",
        Payment_Date: new Date().toISOString().split("T")[0],
      };

      if (
        hasAnnualServicePaymentForYear(payments, updatedPayment, payment.Payment_ID)
      ) {
        setError(
          `${updatedPayment.Payment_Year} annual service payment already exists for this AC unit.`
        );
        return;
      }

      await updateRecord("payments", "Payment_ID", payment.Payment_ID, {
        Payment_Status: updatedPayment.Payment_Status,
        Payment_Date: updatedPayment.Payment_Date,
      });

      setSuccessMessage("Payment marked as paid successfully.");
      await loadPayments();
    } catch (error) {
      setError(error.message);
    } finally {
      setMarkingPaidId("");
    }
  }

  if (loading) return <p>Loading payments...</p>;

  return (
    <div className="payments-page">
      <div className="page-header">
        <h2>Payments</h2>
        <p>
          Manage annual service, repair, and installation payments. Click a record
          to expand details.
        </p>
      </div>

      {error && <p className="error-text">Error: {error}</p>}
      {successMessage && <p className="success-text">{successMessage}</p>}

      <div className="payment-filter-panel">
        <div>
          <h3>{getFilterTitle(activeFilter)}</h3>
          <p>{filteredPayments.length} payment record(s) found</p>
        </div>

        <div className="payment-filter-actions">
          <button
            className={activeFilter === "all" ? "payment-filter-btn active" : "payment-filter-btn"}
            onClick={() => changeFilter("all")}
          >
            All
          </button>

          <button
            className={activeFilter === "pending" ? "payment-filter-btn active" : "payment-filter-btn"}
            onClick={() => changeFilter("pending")}
          >
            Pending
          </button>

          <button
            className={activeFilter === "overdue" ? "payment-filter-btn active danger" : "payment-filter-btn"}
            onClick={() => changeFilter("overdue")}
          >
            Overdue
          </button>

          <button
            className={activeFilter === "paid" ? "payment-filter-btn active success" : "payment-filter-btn"}
            onClick={() => changeFilter("paid")}
          >
            Paid
          </button>

          <button
            className={activeFilter === "annual-service" ? "payment-filter-btn active" : "payment-filter-btn"}
            onClick={() => changeFilter("annual-service")}
          >
            Annual
          </button>

          <button
            className={activeFilter === "repair" ? "payment-filter-btn active" : "payment-filter-btn"}
            onClick={() => changeFilter("repair")}
          >
            Repair
          </button>

          <button
            className={activeFilter === "installation" ? "payment-filter-btn active" : "payment-filter-btn"}
            onClick={() => changeFilter("installation")}
          >
            Installation
          </button>
        </div>
      </div>

      <div className="record-search-panel">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search payments by customer, AC, ID, status, type, amount..."
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery("")}>
            Clear
          </button>
        )}
      </div>

      <div className="customer-record-groups">
        {filteredPayments.length === 0 && (
          <div className="empty-list-card">
            <p>No payment records found for this filter.</p>
            <button className="payment-filter-btn active" onClick={() => changeFilter("all")}>
              Show All Payments
            </button>
          </div>
        )}

        {paymentCustomerGroups.map((group) => (
          <section key={group.key} className="customer-record-card">
            <div className="customer-record-card-header">
              <div>
                <h3>{group.title}</h3>
                <p>{group.description}</p>
              </div>
              <div className="customer-record-status-counts">
                {group.statusCounts.pending > 0 && (
                  <span className="status-badge status-expired">
                    {group.statusCounts.pending} Pending
                  </span>
                )}
                {group.statusCounts.paid > 0 && (
                  <span className="status-badge status-active">
                    {group.statusCounts.paid} Paid
                  </span>
                )}
              </div>
            </div>

            <div className="customer-record-list">
              {group.payments.map((payment, index) => {
          const id = payment.Payment_ID || `${group.key}-${index}`;
          const isExpanded = expandedId === id;
          const evidence = getPaymentEvidence(payment);
          const customerName = getRecordCustomerName(payment, customers);

          return (
            <div key={id} className="customer-record-row">
              <div className="record-card-main" onClick={() => toggleExpand(id)}>
                <span className="record-id-badge">{payment.Payment_ID || "—"}</span>

                <div className="record-summary">
                  <div className="record-primary-row">
                    <span className="record-customer-id">
                      {formatCustomerDisplay(payment.Customer_ID, customerName)}
                    </span>

                    <span className="record-separator">·</span>

                    <span className="record-ac-id">
                      AC: {payment.AC_ID || "—"}
                    </span>

                    <span className="record-separator">·</span>

                    <span className="record-amount">
                      {formatPrice(payment.Amount)}
                    </span>

                    <span className="record-separator">·</span>

                    <span className="record-date">
                      Due: {formatDate(payment.Due_Date)}
                    </span>
                  </div>

                  <div className="record-badge-row">
                    <span
                      className={`status-badge ${getPaymentStatusClass(
                        payment.Payment_Status
                      )}`}
                    >
                      {payment.Payment_Status || "—"}
                    </span>

                    <span
                      className={`status-badge ${getPaymentTypeClass(
                        payment.Payment_Type
                      )}`}
                    >
                      {payment.Payment_Type || "—"}
                    </span>

                    {payment.Payment_Year && (
                      <span className="status-badge status-neutral">
                        {payment.Payment_Year}
                      </span>
                    )}

                    {evidence.hasEvidence && (
                      <span className="status-badge status-info">
                        Evidence
                      </span>
                    )}

                    {payment.Annual_Service_Count &&
                      String(payment.Payment_Type || "").toLowerCase() ===
                        "annual service" && (
                        <span className="status-badge status-neutral">
                          {payment.Annual_Service_Count} Services
                        </span>
                      )}

                    {payment.Service_Generated === "Yes" && (
                      <span className="status-badge status-active">
                        Services Generated
                      </span>
                    )}

                    {isPastDate(payment.Due_Date) &&
                      String(payment.Payment_Status || "").toLowerCase() === "pending" && (
                        <span className="status-badge status-expired">
                          Overdue
                        </span>
                      )}
                  </div>
                </div>

                <div className="record-actions" onClick={(event) => event.stopPropagation()}>
                  {String(payment.Payment_Status || "").toLowerCase() === "pending" && (
                    <button
                      className="mark-paid-btn"
                      onClick={(event) => handleMarkPaid(payment, event)}
                      disabled={markingPaidId === payment.Payment_ID}
                    >
                      {markingPaidId === payment.Payment_ID ? "Updating..." : "Mark Paid"}
                    </button>
                  )}

                  <button
                    className="reminder-btn"
                    onClick={(event) => handleSendReminder(payment, event)}
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

                  <button
                    className="view-link"
                    type="button"
                    onClick={(event) =>
                      openProfileModal(payment.Customer_ID, event)
                    }
                    disabled={profileLoadingId === payment.Customer_ID}
                  >
                    {profileLoadingId === payment.Customer_ID
                      ? "Loading..."
                      : "Profile"}
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
                      <label>Annual Service Count</label>
                      <span>{payment.Annual_Service_Count || "—"}</span>
                    </div>

                    <div className="detail-item">
                      <label>Service Generated</label>
                      <span
                        className={`status-badge ${
                          payment.Service_Generated === "Yes"
                            ? "status-active"
                            : "status-expired"
                        }`}
                      >
                        {payment.Service_Generated || "No"}
                      </span>
                    </div>

                    <div className="detail-item">
                      <label>Reminder Status</label>
                      <span
                        className={`status-badge ${
                          payment.Reminder_Status === "Sent"
                            ? "status-active"
                            : "status-expired"
                        }`}
                      >
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

                    {evidence.hasEvidence && (
                      <div className="detail-item detail-full">
                        <label>Payment Evidence</label>
                        <PaymentEvidence evidence={evidence} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
              })}
            </div>
          </section>
        ))}
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

                {editFormData.Payment_Type === "Annual Service" && (
                  <div className="form-group">
                    <label>Annual Service Count</label>
                    <select
                      name="Annual_Service_Count"
                      value={editFormData.Annual_Service_Count}
                      onChange={handleEditChange}
                    >
                      <option value="1">1 Service</option>
                      <option value="2">2 Services</option>
                      <option value="3">3 Services</option>
                      <option value="4">4 Services</option>
                    </select>
                    <span className="form-hint">
                      Services generate when status is Paid.
                    </span>
                  </div>
                )}

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

              {editFormData.Payment_Type === "Annual Service" &&
                editFormData.Payment_Status === "Paid" && (
                  <div className="annual-service-preview-card">
                    <h3>Annual Service Schedule Preview</h3>
                    <p>
                      Updating this annual payment as Paid will generate{" "}
                      <strong>{editFormData.Annual_Service_Count}</strong>{" "}
                      service(s), if not already generated.
                    </p>
                    <p className="annual-service-preview-note">
                      Schedule pattern:{" "}
                      {getServicePreviewText(editFormData.Annual_Service_Count)}
                    </p>
                  </div>
                )}

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={closeEditModal}>
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

      {selectedProfile && (
        <CustomerProfileModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
}

function paymentMatchesSearch(payment, customers, query) {
  return recordMatchesSearch(payment, customers, query, [
    "Payment_ID",
    "Customer_ID",
    "AC_ID",
    "Payment_Year",
    "Payment_Date",
    "Amount",
    "Payment_Type",
    "Payment_Status",
    "Due_Date",
    "Annual_Service_Count",
    "Service_Generated",
    "Reminder_Status",
    "Notes",
  ]);
}

function getPaymentCustomerGroups(payments, customers) {
  const groupMap = new Map();

  payments.forEach((payment) => {
    const customerId = payment.Customer_ID || "-";
    const customerName = getRecordCustomerName(payment, customers);
    const key = String(customerId).trim() || "unknown-customer";

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        title: formatCustomerDisplay(customerId, customerName),
        description: "",
        payments: [],
        statusCounts: {
          pending: 0,
          paid: 0,
        },
      });
    }

    const group = groupMap.get(key);
    group.payments.push(payment);

    const status = String(payment.Payment_Status || "").toLowerCase().trim();
    if (group.statusCounts[status] !== undefined) {
      group.statusCounts[status] += 1;
    }
  });

  return Array.from(groupMap.values()).map((group) => ({
    ...group,
    description: `${group.payments.length} payment${
      group.payments.length === 1 ? "" : "s"
    } for this customer`,
  }));
}

function getFilterTitle(filter) {
  if (filter === "pending") return "Pending Payments";
  if (filter === "overdue") return "Overdue Payments";
  if (filter === "paid") return "Paid Payments";
  if (filter === "annual-service") return "Annual Service Payments";
  if (filter === "repair") return "Repair Payments";
  if (filter === "installation") return "Installation Payments";
  return "All Payments";
}

function getServicePreviewText(count) {
  if (String(count) === "1") return "+12 months";
  if (String(count) === "2") return "+6 months, +12 months";
  if (String(count) === "3") return "+4 months, +8 months, +12 months";
  if (String(count) === "4") return "+3 months, +6 months, +9 months, +12 months";

  return "+4 months, +8 months, +12 months";
}

function isPastDate(value) {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const cleanDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const today = new Date();
  const cleanToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  return cleanDate < cleanToday;
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
