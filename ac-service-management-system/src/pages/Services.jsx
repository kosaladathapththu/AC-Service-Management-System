import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getAllData,
  getCustomerProfile,
  updateRecord,
  sendManualReminder,
} from "../api/googleSheetApi";
import CustomerProfileModal from "../components/CustomerProfileModal";
import {
  formatCustomerDisplay,
  getRecordCustomerName,
} from "../utils/customerDisplay";
import { recordMatchesSearch } from "../utils/recordSearch";

function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get("filter") || "all";

  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState("");
  const [markingCompletedIds, setMarkingCompletedIds] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateOrder, setDateOrder] = useState("upcoming");
  const [profileLoadingId, setProfileLoadingId] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);

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
    const year = String(service.Service_Year || "").toLowerCase();
    const category = String(service.Service_Category || "").toLowerCase();

    if (!serviceMatchesSearch(service, customers, searchQuery)) return false;

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

    if (activeFilter === "paid-annual") {
      return type === "paid" && ["year 2", "year 3", "year 4", "year 5"].includes(year);
    }

    if (activeFilter === "year-1") {
      return year === "year 1";
    }

    if (activeFilter === "year-2") {
      return year === "year 2";
    }

    if (activeFilter === "year-3") {
      return year === "year 3";
    }

    if (activeFilter === "year-4") {
      return year === "year 4";
    }

    if (activeFilter === "year-5") {
      return year === "year 5";
    }

    if (activeFilter === "normal") {
      return category === "normal";
    }

    if (activeFilter === "high-pressure") {
      return category === "high-pressure";
    }

    if (activeFilter === "other-services") {
      return category && !["normal", "high-pressure"].includes(category);
    }

    return true;
  });
  const isPendingDateList = activeFilter === "pending";
  const sortedServices = sortServicesByDate(
    filteredServices,
    isPendingDateList ? "upcoming" : dateOrder
  );
  const serviceCustomerGroups = isPendingDateList
    ? getPendingServiceDateGroup(sortedServices)
    : getCustomerServiceGroups(sortedServices, customers);
  const selectedYearFilter = [
    "year-1",
    "year-2",
    "year-3",
    "year-4",
    "year-5",
  ].includes(activeFilter)
    ? activeFilter
    : "";
  const selectedCategoryFilter = [
    "normal",
    "high-pressure",
    "other-services",
  ].includes(activeFilter)
    ? activeFilter
    : "";

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

      setServices((prev) =>
        prev.map((service) =>
          service.Service_ID === editingService.Service_ID
            ? { ...service, ...editFormData }
            : service
        )
      );
      setSuccessMessage("Service updated successfully.");
      closeEditModal();
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

  async function handleMarkCompleted(service, event) {
    event.stopPropagation();

    try {
      setMarkingCompletedIds((prev) =>
        prev.includes(service.Service_ID) ? prev : [...prev, service.Service_ID]
      );
      setError("");
      setSuccessMessage("");

      await updateRecord("services", "Service_ID", service.Service_ID, {
        Service_Status: "Completed",
      });

      setServices((prev) =>
        prev.map((item) =>
          item.Service_ID === service.Service_ID
            ? { ...item, Service_Status: "Completed" }
            : item
        )
      );
      setSuccessMessage("Service marked as completed successfully.");
    } catch (error) {
      setError(error.message);
    } finally {
      setMarkingCompletedIds((prev) =>
        prev.filter((serviceId) => serviceId !== service.Service_ID)
      );
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

        <div className="service-filter-actions service-filter-toolbar">
          <div className="service-filter-group">
            <span className="service-filter-label">Status</span>
            <div className="service-filter-options">
              <ServiceFilterButton
                active={activeFilter === "all"}
                onClick={() => changeFilter("all")}
              >
                All
              </ServiceFilterButton>
              <ServiceFilterButton
                active={activeFilter === "due-this-month"}
                onClick={() => changeFilter("due-this-month")}
              >
                Due This Month
              </ServiceFilterButton>
              <ServiceFilterButton
                active={activeFilter === "overdue"}
                variant="danger"
                onClick={() => changeFilter("overdue")}
              >
                Overdue
              </ServiceFilterButton>
              <ServiceFilterButton
                active={activeFilter === "pending"}
                onClick={() => changeFilter("pending")}
              >
                Pending
              </ServiceFilterButton>
              <ServiceFilterButton
                active={activeFilter === "completed"}
                variant="success"
                onClick={() => changeFilter("completed")}
              >
                Completed
              </ServiceFilterButton>
              <ServiceFilterButton
                active={activeFilter === "rescheduled"}
                variant="warning"
                onClick={() => changeFilter("rescheduled")}
              >
                Rescheduled
              </ServiceFilterButton>
            </div>
          </div>

          <div className="service-filter-group">
            <span className="service-filter-label">Type</span>
            <div className="service-filter-options">
              <ServiceFilterButton
                active={activeFilter === "free"}
                variant="success"
                onClick={() => changeFilter("free")}
              >
                Free
              </ServiceFilterButton>
              <ServiceFilterButton
                active={activeFilter === "paid"}
                onClick={() => changeFilter("paid")}
              >
                Paid
              </ServiceFilterButton>
              <ServiceFilterButton
                active={activeFilter === "paid-annual"}
                onClick={() => changeFilter("paid-annual")}
              >
                Paid Annual
              </ServiceFilterButton>
            </div>
          </div>

          <div className="service-filter-group service-filter-select-group">
            <label className="service-filter-label" htmlFor="service-year-filter">
              Year
            </label>
            <select
              id="service-year-filter"
              className="service-filter-select"
              value={selectedYearFilter}
              onChange={(event) => changeFilter(event.target.value || "all")}
            >
              <option value="">All years</option>
              <option value="year-1">Year 1</option>
              <option value="year-2">Year 2</option>
              <option value="year-3">Year 3</option>
              <option value="year-4">Year 4</option>
              <option value="year-5">Year 5</option>
            </select>
          </div>

          <div className="service-filter-group service-filter-select-group">
            <label className="service-filter-label" htmlFor="service-category-filter">
              Category
            </label>
            <select
              id="service-category-filter"
              className="service-filter-select"
              value={selectedCategoryFilter}
              onChange={(event) => changeFilter(event.target.value || "all")}
            >
              <option value="">All categories</option>
              <option value="normal">Normal</option>
              <option value="high-pressure">High-pressure</option>
              <option value="other-services">Other</option>
            </select>
          </div>

          <div className="service-filter-group service-filter-select-group">
            <label className="service-filter-label" htmlFor="service-date-order">
              Date Order
            </label>
            <select
              id="service-date-order"
              className="service-filter-select"
              value={isPendingDateList ? "upcoming" : dateOrder}
              disabled={isPendingDateList}
              onChange={(event) => setDateOrder(event.target.value)}
            >
              <option value="upcoming">Nearest first</option>
              <option value="latest">Latest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
      </div>

      <div className="record-search-panel">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search services by customer, AC, ID, year, type, category, status, technician..."
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery("")}>
            Clear
          </button>
        )}
      </div>

      <div className="service-customer-groups">
        {sortedServices.length === 0 && (
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

        {serviceCustomerGroups.map((section) => (
          <section key={section.key} className="service-customer-card">
            <div className="service-customer-card-header">
              <div>
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </div>
              <div className="service-customer-status-counts">
                {section.statusCounts.pending > 0 && (
                  <span className="status-badge status-expired">
                    {section.statusCounts.pending} Pending
                  </span>
                )}
                {section.statusCounts.rescheduled > 0 && (
                  <span className="status-badge status-info">
                    {section.statusCounts.rescheduled} Rescheduled
                  </span>
                )}
                {section.statusCounts.completed > 0 && (
                  <span className="status-badge status-active">
                    {section.statusCounts.completed} Completed
                  </span>
                )}
                {section.statusCounts.cancelled > 0 && (
                  <span className="status-badge status-cancelled">
                    {section.statusCounts.cancelled} Cancelled
                  </span>
                )}
              </div>
            </div>

            <div className="service-customer-service-list">
              {section.services.map((service, index) => {
                const id = service.Service_ID || `${section.key}-${index}`;
                const isExpanded = expandedId === id;
                const customerName = getRecordCustomerName(service, customers);

          return (
            <div key={id} className="service-row-card">
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

                    {service.Service_Category && (
                      <span className="status-badge status-neutral">
                        {service.Service_Category}
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
                  {["pending", "rescheduled"].includes(
                    String(service.Service_Status || "").toLowerCase()
                  ) && (
                    <button
                      className="mark-completed-btn"
                      onClick={(event) => handleMarkCompleted(service, event)}
                      disabled={markingCompletedIds.includes(
                        service.Service_ID
                      )}
                    >
                      {markingCompletedIds.includes(service.Service_ID)
                        ? "Updating..."
                        : "Mark Completed"}
                    </button>
                  )}

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

                  <button
                    className="view-link"
                    type="button"
                    onClick={(event) =>
                      openProfileModal(service.Customer_ID, event)
                    }
                    disabled={profileLoadingId === service.Customer_ID}
                  >
                    {profileLoadingId === service.Customer_ID
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
          </section>
        ))}
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

      {selectedProfile && (
        <CustomerProfileModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </div>
  );
}

function serviceMatchesSearch(service, customers, query) {
  return recordMatchesSearch(service, customers, query, [
    "Service_ID",
    "Customer_ID",
    "AC_ID",
    "Service_Date",
    "Service_Year",
    "Service_No",
    "Service_Type",
    "Service_Category",
    "Technician_Name",
    "Service_Status",
    "Payment_Required",
    "Reminder_Status",
    "Notes",
  ]);
}

function sortServicesByDate(services, dateOrder) {
  return [...services].sort((a, b) => {
    const dateA = getDateTime(a.Service_Date);
    const dateB = getDateTime(b.Service_Date);

    if (dateOrder === "latest") return dateB - dateA;
    if (dateOrder === "oldest") return dateA - dateB;

    return dateA - dateB;
  });
}

function getDateTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return Number.MAX_SAFE_INTEGER;
  }

  return date.getTime();
}

function ServiceFilterButton({ active, variant = "", onClick, children }) {
  const classNames = [
    "service-filter-btn",
    active ? "active" : "",
    active && variant ? variant : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={classNames} onClick={onClick}>
      {children}
    </button>
  );
}

function getCustomerServiceGroups(services, customers) {
  const groupMap = new Map();

  services.forEach((service) => {
    const customerId = service.Customer_ID || "-";
    const customerName = getRecordCustomerName(service, customers);
    const key = String(customerId).trim() || "unknown-customer";

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        title: formatCustomerDisplay(customerId, customerName),
        description: "",
        services: [],
        statusCounts: {
          pending: 0,
          rescheduled: 0,
          completed: 0,
          cancelled: 0,
        },
      });
    }

    const group = groupMap.get(key);
    group.services.push(service);

    const status = String(service.Service_Status || "").toLowerCase().trim();
    if (group.statusCounts[status] !== undefined) {
      group.statusCounts[status] += 1;
    }
  });

  return Array.from(groupMap.values()).map((group) => ({
    ...group,
    description: `${group.services.length} service${
      group.services.length === 1 ? "" : "s"
    } for this customer`,
  }));
}

function getPendingServiceDateGroup(services) {
  return [
    {
      key: "pending-services-by-date",
      title: "Pending Services by Date",
      description: "Nearest service date first, then farther dates.",
      services,
      statusCounts: {
        pending: services.filter(
          (service) => normalizeValue(service.Service_Status) === "pending"
        ).length,
        rescheduled: 0,
        completed: 0,
        cancelled: 0,
      },
    },
  ];
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
  if (filter === "paid-annual") return "Paid Annual Services";
  if (filter === "year-1") return "Year 1 Services";
  if (filter === "year-2") return "Year 2 Services";
  if (filter === "year-3") return "Year 3 Services";
  if (filter === "year-4") return "Year 4 Services";
  if (filter === "year-5") return "Year 5 Services";
  if (filter === "normal") return "Normal Services";
  if (filter === "high-pressure") return "High-pressure Services";
  if (filter === "other-services") return "Other Services";
  return "All Services";
}

function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
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
