import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  getAllData,
  updateRecord,
  sendManualReminder,
} from "../api/googleSheetApi";
import {
  formatCustomerDisplay,
  getRecordCustomerName,
} from "../utils/customerDisplay";

function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get("filter") || "all";

  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const [editingService, setEditingService] = useState(null);
  const [editFormData, setEditFormData] = useState({
    Service_Date: "",
    Service_Year: "",
    Service_No: "",
    Service_Type: "Free",
    Service_Category: "Normal",
    Technician_Name: "",
    Service_Status: "Pending",
    Payment_Required: "No",
    Notes: "",
  });

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      setLoading(true);
      setError("");

      const [servicesData, customersData] = await Promise.all([
        getAllData("services"),
        getAllData("customers"),
      ]);

      setServices(servicesData);
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

  const filteredServices = services.filter((service) => {
    const status = String(service.Service_Status || "").toLowerCase();
    const type = String(service.Service_Type || "").toLowerCase();

    if (activeFilter === "due-this-month") {
      return (
        isCurrentMonth(service.Service_Date) &&
        (status === "pending" || status === "rescheduled")
      );
    }

    if (activeFilter === "overdue") {
      return (
        isPastDate(service.Service_Date) &&
        (status === "pending" || status === "rescheduled")
      );
    }

    if (activeFilter === "pending") {
      return status === "pending";
    }

    if (activeFilter === "completed") {
      return status === "completed";
    }

    if (activeFilter === "rescheduled") {
      return status === "rescheduled";
    }

    if (activeFilter === "cancelled") {
      return status === "cancelled";
    }

    if (activeFilter === "free") {
      return type === "free";
    }

    if (activeFilter === "paid") {
      return type === "paid";
    }

    return true;
  });

  function toggleExpand(serviceId) {
    setExpandedId((prev) => (prev === serviceId ? null : serviceId));
  }

  function openEditModal(service) {
    setEditingService(service);

    setEditFormData({
      Service_Date: formatDateForInput(service.Service_Date),
      Service_Year: service.Service_Year || "",
      Service_No: service.Service_No || "",
      Service_Type: service.Service_Type || "Free",
      Service_Category: service.Service_Category || "Normal",
      Technician_Name: service.Technician_Name || "",
      Service_Status: service.Service_Status || "Pending",
      Payment_Required: service.Payment_Required || "No",
      Notes: service.Notes || "",
    });
  }

  function closeEditModal() {
    setEditingService(null);

    setEditFormData({
      Service_Date: "",
      Service_Year: "",
      Service_No: "",
      Service_Type: "Free",
      Service_Category: "Normal",
      Technician_Name: "",
      Service_Status: "Pending",
      Payment_Required: "No",
      Notes: "",
    });
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    if (name === "Service_Type") {
      setEditFormData((prev) => ({
        ...prev,
        Service_Type: value,
        Payment_Required: value === "Paid" ? "Yes" : "No",
      }));

      return;
    }

    setEditFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUpdateService(event) {
    event.preventDefault();

    if (!editingService) return;

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      await updateRecord(
        "services",
        "Service_ID",
        editingService.Service_ID,
        editFormData
      );

      setSuccessMessage("Service updated successfully.");
      closeEditModal();
      await loadServices();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSendReminder(service, event) {
    event.stopPropagation();

    try {
      setSendingReminderId(service.Service_ID);
      setError("");
      setSuccessMessage("");

      await sendManualReminder("service", service.Service_ID);

      setSuccessMessage("Service reminder email sent successfully.");
      await loadServices();
    } catch (error) {
      setError(error.message);
    } finally {
      setSendingReminderId("");
    }
  }

  if (loading) return <p>Loading services...</p>;

  return (
    <div className="services-page">
      <div className="page-header">
        <h2>Services</h2>
        <p>
          Manage free and paid AC service schedules. Click a record to expand
          details.
        </p>
      </div>

      {error && <p className="error-text">Error: {error}</p>}
      {successMessage && <p className="success-text">{successMessage}</p>}

      <div className="service-filter-panel">
        <div>
          <h3>{getFilterTitle(activeFilter)}</h3>
          <p>{filteredServices.length} service record(s) found</p>
        </div>

        <div className="service-filter-actions">
          <button
            className={
              activeFilter === "all"
                ? "service-filter-btn active"
                : "service-filter-btn"
            }
            onClick={() => changeFilter("all")}
          >
            All
          </button>

          <button
            className={
              activeFilter === "due-this-month"
                ? "service-filter-btn active"
                : "service-filter-btn"
            }
            onClick={() => changeFilter("due-this-month")}
          >
            Due This Month
          </button>

          <button
            className={
              activeFilter === "overdue"
                ? "service-filter-btn active danger"
                : "service-filter-btn"
            }
            onClick={() => changeFilter("overdue")}
          >
            Overdue
          </button>

          <button
            className={
              activeFilter === "pending"
                ? "service-filter-btn active"
                : "service-filter-btn"
            }
            onClick={() => changeFilter("pending")}
          >
            Pending
          </button>

          <button
            className={
              activeFilter === "completed"
                ? "service-filter-btn active success"
                : "service-filter-btn"
            }
            onClick={() => changeFilter("completed")}
          >
            Completed
          </button>

          <button
            className={
              activeFilter === "rescheduled"
                ? "service-filter-btn active warning"
                : "service-filter-btn"
            }
            onClick={() => changeFilter("rescheduled")}
          >
            Rescheduled
          </button>

          <button
            className={
              activeFilter === "free"
                ? "service-filter-btn active success"
                : "service-filter-btn"
            }
            onClick={() => changeFilter("free")}
          >
            Free
          </button>

          <button
            className={
              activeFilter === "paid"
                ? "service-filter-btn active"
                : "service-filter-btn"
            }
            onClick={() => changeFilter("paid")}
          >
            Paid
          </button>
        </div>
      </div>

      <div className="record-list">
        {filteredServices.length === 0 && (
          <div className="empty-list-card">
            <p>No service records found for this filter.</p>
            <button
              className="service-filter-btn active"
              onClick={() => changeFilter("all")}
            >
              Show All Services
            </button>
          </div>
        )}

        {filteredServices.map((service, index) => {
          const id = service.Service_ID || index;
          const isExpanded = expandedId === id;
          const customerName = getRecordCustomerName(service, customers);

          return (
            <div key={id} className="record-card">
              <div
                className="record-card-main"
                onClick={() => toggleExpand(id)}
              >
                <span className="record-id-badge">
                  {service.Service_ID || "—"}
                </span>

                <div className="record-summary">
                  <div className="record-primary-row">
                    <span className="record-customer-id">
                      {formatCustomerDisplay(service.Customer_ID, customerName)}
                    </span>

                    <span className="record-separator">·</span>

                    <span className="record-ac-id">
                      AC: {service.AC_ID || "—"}
                    </span>

                    <span className="record-separator">·</span>

                    <span className="record-date">
                      {formatDate(service.Service_Date)}
                    </span>

                    {service.Technician_Name && (
                      <>
                        <span className="record-separator">·</span>
                        <span className="record-tech">
                          {service.Technician_Name}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="record-badge-row">
                    <span
                      className={`status-badge ${getServiceStatusClass(
                        service.Service_Status
                      )}`}
                    >
                      {service.Service_Status || "—"}
                    </span>

                    <span
                      className={`status-badge ${getServiceTypeClass(
                        service.Service_Type
                      )}`}
                    >
                      {service.Service_Type || "—"}
                    </span>

                    {service.Service_Year && (
                      <span className="status-badge status-neutral">
                        {service.Service_Year}
                      </span>
                    )}

                    {service.Service_No && (
                      <span className="status-badge status-neutral">
                        Service {service.Service_No}
                      </span>
                    )}

                    {isPastDate(service.Service_Date) &&
                      ["pending", "rescheduled"].includes(
                        String(service.Service_Status || "").toLowerCase()
                      ) && (
                        <span className="status-badge status-expired">
                          Overdue
                        </span>
                      )}
                  </div>
                </div>

                <div
                  className="record-actions"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    className="reminder-btn"
                    onClick={(event) => handleSendReminder(service, event)}
                    disabled={sendingReminderId === service.Service_ID}
                  >
                    {sendingReminderId === service.Service_ID
                      ? "Sending..."
                      : service.Reminder_Status === "Sent"
                      ? "Resend"
                      : "Send"}
                  </button>

                  <button
                    className="edit-btn"
                    onClick={() => openEditModal(service)}
                  >
                    Edit
                  </button>

                  <Link
                    className="view-link"
                    to={`/customers/${service.Customer_ID}`}
                  >
                    Profile
                  </Link>
                </div>

                <button className="expand-btn" aria-label="Expand record">
                  {isExpanded ? "▴" : "▾"}
                </button>
              </div>

              {isExpanded && (
                <div className="record-card-detail">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Service Year</label>
                      <span>{service.Service_Year || "—"}</span>
                    </div>

                    <div className="detail-item">
                      <label>Service No</label>
                      <span>{service.Service_No || "—"}</span>
                    </div>

                    <div className="detail-item">
                      <label>Category</label>
                      <span>{service.Service_Category || "—"}</span>
                    </div>

                    <div className="detail-item">
                      <label>Payment Required</label>
                      <span>{service.Payment_Required || "—"}</span>
                    </div>

                    <div className="detail-item">
                      <label>Reminder Status</label>
                      <span
                        className={`status-badge ${
                          service.Reminder_Status === "Sent"
                            ? "status-active"
                            : "status-expired"
                        }`}
                      >
                        {service.Reminder_Status || "Not Sent"}
                      </span>
                    </div>

                    <div className="detail-item">
                      <label>Reminder Sent Date</label>
                      <span>{formatDate(service.Reminder_Sent_Date)}</span>
                    </div>

                    {service.Notes && (
                      <div className="detail-item detail-full">
                        <label>Notes</label>
                        <span>{service.Notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingService && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Service</h3>
              <button className="close-btn" onClick={closeEditModal}>
                ×
              </button>
            </div>

            <p className="modal-subtitle">
              Service ID: <strong>{editingService.Service_ID}</strong>
            </p>

            <form onSubmit={handleUpdateService}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Service Date</label>
                  <input
                    type="date"
                    name="Service_Date"
                    value={editFormData.Service_Date}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Service Year</label>
                  <select
                    name="Service_Year"
                    value={editFormData.Service_Year}
                    onChange={handleEditChange}
                  >
                    <option value="">Select year</option>
                    <option value="Year 1">Year 1</option>
                    <option value="Year 2">Year 2</option>
                    <option value="Year 3">Year 3</option>
                    <option value="Year 4">Year 4</option>
                    <option value="Year 5">Year 5</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Service No</label>
                  <select
                    name="Service_No"
                    value={editFormData.Service_No}
                    onChange={handleEditChange}
                  >
                    <option value="">Select service no</option>
                    <option value="1">Service 1</option>
                    <option value="2">Service 2</option>
                    <option value="3">Service 3</option>
                    <option value="4">Service 4</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Service Type</label>
                  <select
                    name="Service_Type"
                    value={editFormData.Service_Type}
                    onChange={handleEditChange}
                  >
                    <option value="Free">Free</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Service Category</label>
                  <select
                    name="Service_Category"
                    value={editFormData.Service_Category}
                    onChange={handleEditChange}
                  >
                    <option value="Normal">Normal</option>
                    <option value="High-pressure">High-pressure</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Technician Name</label>
                  <input
                    type="text"
                    name="Technician_Name"
                    value={editFormData.Technician_Name}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Service Status</label>
                  <select
                    name="Service_Status"
                    value={editFormData.Service_Status}
                    onChange={handleEditChange}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Rescheduled">Rescheduled</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Payment Required</label>
                  <select
                    name="Payment_Required"
                    value={editFormData.Payment_Required}
                    onChange={handleEditChange}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
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
                  {saving ? "Updating..." : "Update Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getFilterTitle(filter) {
  if (filter === "due-this-month") return "Services Due This Month";
  if (filter === "overdue") return "Overdue Services";
  if (filter === "pending") return "Pending Services";
  if (filter === "completed") return "Completed Services";
  if (filter === "rescheduled") return "Rescheduled Services";
  if (filter === "cancelled") return "Cancelled Services";
  if (filter === "free") return "Free Services";
  if (filter === "paid") return "Paid Services";
  return "All Services";
}

function isCurrentMonth(value) {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth()
  );
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

export default Services;
