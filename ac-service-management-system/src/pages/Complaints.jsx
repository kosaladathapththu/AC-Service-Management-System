import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getAllData,
  getCustomerProfile,
  updateRecord,
} from "../api/googleSheetApi";
import CustomerProfileModal from "../components/CustomerProfileModal";
import {
  formatCustomerDisplay,
  getRecordCustomerName,
} from "../utils/customerDisplay";
import { recordMatchesSearch } from "../utils/recordSearch";

function Complaints() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get("filter") || "all";

  const [complaints, setComplaints] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileLoadingId, setProfileLoadingId] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);

  const [editingComplaint, setEditingComplaint] = useState(null);
  const [editFormData, setEditFormData] = useState({
    Complaint_Date: "",
    Issue_Description: "",
    Technician_Name: "",
    Action_Taken: "",
    Cost_Type: "Free",
    Cost_Amount: "",
    Complaint_Status: "Open",
    Notes: "",
  });

  useEffect(() => {
    loadComplaints();
  }, []);

  async function loadComplaints() {
    try {
      setLoading(true);
      setError("");

      const [complaintsData, customersData] = await Promise.all([
        getAllData("complaints"),
        getAllData("customers"),
      ]);

      setComplaints(complaintsData);
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

  const filteredComplaints = complaints.filter((complaint) => {
    const status = String(complaint.Complaint_Status || "").toLowerCase();
    const costType = String(complaint.Cost_Type || "").toLowerCase();

    if (!complaintMatchesSearch(complaint, customers, searchQuery)) return false;

    if (activeFilter === "open") {
      return status === "open" || status === "in progress";
    }

    if (activeFilter === "only-open") {
      return status === "open";
    }

    if (activeFilter === "in-progress") {
      return status === "in progress";
    }

    if (activeFilter === "completed") {
      return status === "completed";
    }

    if (activeFilter === "cancelled") {
      return status === "cancelled";
    }

    if (activeFilter === "free") {
      return costType === "free";
    }

    if (activeFilter === "paid") {
      return costType === "paid";
    }

    return true;
  });

  function toggleExpand(complaintId) {
    setExpandedId((prev) => (prev === complaintId ? null : complaintId));
  }

  function openEditModal(complaint) {
    setEditingComplaint(complaint);

    setEditFormData({
      Complaint_Date: formatDateForInput(complaint.Complaint_Date),
      Issue_Description: complaint.Issue_Description || "",
      Technician_Name: complaint.Technician_Name || "",
      Action_Taken: complaint.Action_Taken || "",
      Cost_Type: complaint.Cost_Type || "Free",
      Cost_Amount: complaint.Cost_Amount || "",
      Complaint_Status: complaint.Complaint_Status || "Open",
      Notes: complaint.Notes || "",
    });
  }

  function closeEditModal() {
    setEditingComplaint(null);

    setEditFormData({
      Complaint_Date: "",
      Issue_Description: "",
      Technician_Name: "",
      Action_Taken: "",
      Cost_Type: "Free",
      Cost_Amount: "",
      Complaint_Status: "Open",
      Notes: "",
    });
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

  function handleEditChange(event) {
    const { name, value } = event.target;

    if (name === "Cost_Type") {
      setEditFormData((prev) => ({
        ...prev,
        Cost_Type: value,
        Cost_Amount: value === "Free" ? "" : prev.Cost_Amount,
      }));

      return;
    }

    setEditFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUpdateComplaint(event) {
    event.preventDefault();

    if (!editingComplaint) return;

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      await updateRecord(
        "complaints",
        "Complaint_ID",
        editingComplaint.Complaint_ID,
        editFormData
      );

      setSuccessMessage("Complaint updated successfully.");
      closeEditModal();
      await loadComplaints();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading complaints...</p>;

  return (
    <div className="complaints-page">
      <div className="page-header">
        <h2>Complaints</h2>
        <p>
          Manage customer complaints and AC repair records. Click a record to
          expand details.
        </p>
      </div>

      {error && <p className="error-text">Error: {error}</p>}
      {successMessage && <p className="success-text">{successMessage}</p>}

      <div className="complaint-filter-panel">
        <div>
          <h3>{getFilterTitle(activeFilter)}</h3>
          <p>{filteredComplaints.length} complaint record(s) found</p>
        </div>

        <div className="complaint-filter-actions">
          <button
            className={
              activeFilter === "all"
                ? "complaint-filter-btn active"
                : "complaint-filter-btn"
            }
            onClick={() => changeFilter("all")}
          >
            All
          </button>

          <button
            className={
              activeFilter === "open"
                ? "complaint-filter-btn active danger"
                : "complaint-filter-btn"
            }
            onClick={() => changeFilter("open")}
          >
            Need Action
          </button>

          <button
            className={
              activeFilter === "only-open"
                ? "complaint-filter-btn active danger"
                : "complaint-filter-btn"
            }
            onClick={() => changeFilter("only-open")}
          >
            Open
          </button>

          <button
            className={
              activeFilter === "in-progress"
                ? "complaint-filter-btn active warning"
                : "complaint-filter-btn"
            }
            onClick={() => changeFilter("in-progress")}
          >
            In Progress
          </button>

          <button
            className={
              activeFilter === "completed"
                ? "complaint-filter-btn active success"
                : "complaint-filter-btn"
            }
            onClick={() => changeFilter("completed")}
          >
            Completed
          </button>

          <button
            className={
              activeFilter === "paid"
                ? "complaint-filter-btn active"
                : "complaint-filter-btn"
            }
            onClick={() => changeFilter("paid")}
          >
            Paid Repair
          </button>

          <button
            className={
              activeFilter === "free"
                ? "complaint-filter-btn active success"
                : "complaint-filter-btn"
            }
            onClick={() => changeFilter("free")}
          >
            Free Repair
          </button>
        </div>
      </div>

      <div className="record-search-panel">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search complaints by customer, AC, ID, status, issue, technician..."
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery("")}>
            Clear
          </button>
        )}
      </div>

      <div className="record-list">
        {filteredComplaints.length === 0 && (
          <div className="empty-list-card">
            <p>No complaint records found for this filter.</p>
            <button
              className="complaint-filter-btn active"
              onClick={() => changeFilter("all")}
            >
              Show All Complaints
            </button>
          </div>
        )}

        {filteredComplaints.map((complaint, index) => {
          const id = complaint.Complaint_ID || index;
          const isExpanded = expandedId === id;
          const customerName = getRecordCustomerName(complaint, customers);

          return (
            <div key={id} className="record-card">
              <div
                className="record-card-main"
                onClick={() => toggleExpand(id)}
              >
                <span className="record-id-badge">
                  {complaint.Complaint_ID || "—"}
                </span>

                <div className="record-summary">
                  <div className="record-primary-row">
                    <span className="record-customer-id">
                      {formatCustomerDisplay(complaint.Customer_ID, customerName)}
                    </span>

                    <span className="record-separator">·</span>

                    <span className="record-ac-id">
                      AC: {complaint.AC_ID || "—"}
                    </span>

                    <span className="record-separator">·</span>

                    <span className="record-date">
                      {formatDate(complaint.Complaint_Date)}
                    </span>

                    {complaint.Technician_Name && (
                      <>
                        <span className="record-separator">·</span>
                        <span className="record-tech">
                          {complaint.Technician_Name}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="record-badge-row">
                    <span
                      className={`status-badge ${getComplaintStatusClass(
                        complaint.Complaint_Status
                      )}`}
                    >
                      {complaint.Complaint_Status || "—"}
                    </span>

                    <span
                      className={`status-badge ${getCostTypeClass(
                        complaint.Cost_Type
                      )}`}
                    >
                      {complaint.Cost_Type || "—"}
                    </span>

                    {complaint.Issue_Description && (
                      <span className="record-issue-preview">
                        {complaint.Issue_Description.substring(0, 60)}
                        {complaint.Issue_Description.length > 60 ? "…" : ""}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className="record-actions"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    className="edit-btn"
                    onClick={() => openEditModal(complaint)}
                  >
                    Edit
                  </button>

                  <button
                    className="view-link"
                    type="button"
                    onClick={(event) =>
                      openProfileModal(complaint.Customer_ID, event)
                    }
                    disabled={profileLoadingId === complaint.Customer_ID}
                  >
                    {profileLoadingId === complaint.Customer_ID
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
                      <label>Cost Amount</label>
                      <span>{formatPrice(complaint.Cost_Amount)}</span>
                    </div>

                    <div className="detail-item">
                      <label>Complaint Date</label>
                      <span>{formatDate(complaint.Complaint_Date)}</span>
                    </div>

                    <div className="detail-item">
                      <label>Technician</label>
                      <span>{complaint.Technician_Name || "—"}</span>
                    </div>

                    <div className="detail-item">
                      <label>Cost Type</label>
                      <span>{complaint.Cost_Type || "—"}</span>
                    </div>

                    <div className="detail-item">
                      <label>Status</label>
                      <span>{complaint.Complaint_Status || "—"}</span>
                    </div>

                    <div className="detail-item detail-full">
                      <label>Issue Description</label>
                      <span>{complaint.Issue_Description || "—"}</span>
                    </div>

                    <div className="detail-item detail-full">
                      <label>Action Taken</label>
                      <span>{complaint.Action_Taken || "—"}</span>
                    </div>

                    {complaint.Notes && (
                      <div className="detail-item detail-full">
                        <label>Notes</label>
                        <span>{complaint.Notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingComplaint && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Complaint</h3>
              <button className="close-btn" onClick={closeEditModal}>
                ×
              </button>
            </div>

            <p className="modal-subtitle">
              Complaint ID: <strong>{editingComplaint.Complaint_ID}</strong>
            </p>

            <form onSubmit={handleUpdateComplaint}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Complaint Date</label>
                  <input
                    type="date"
                    name="Complaint_Date"
                    value={editFormData.Complaint_Date}
                    onChange={handleEditChange}
                  />
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
                  <label>Cost Type</label>
                  <select
                    name="Cost_Type"
                    value={editFormData.Cost_Type}
                    onChange={handleEditChange}
                  >
                    <option value="Free">Free</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Cost Amount</label>
                  <input
                    type="number"
                    name="Cost_Amount"
                    value={editFormData.Cost_Amount}
                    onChange={handleEditChange}
                    min="0"
                    disabled={editFormData.Cost_Type === "Free"}
                  />
                </div>

                <div className="form-group">
                  <label>Complaint Status</label>
                  <select
                    name="Complaint_Status"
                    value={editFormData.Complaint_Status}
                    onChange={handleEditChange}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Issue Description</label>
                  <textarea
                    name="Issue_Description"
                    value={editFormData.Issue_Description}
                    onChange={handleEditChange}
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-group full-width">
                  <label>Action Taken</label>
                  <textarea
                    name="Action_Taken"
                    value={editFormData.Action_Taken}
                    onChange={handleEditChange}
                    rows="3"
                  ></textarea>
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
                  {saving ? "Updating..." : "Update Complaint"}
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

function complaintMatchesSearch(complaint, customers, query) {
  return recordMatchesSearch(complaint, customers, query, [
    "Complaint_ID",
    "Customer_ID",
    "AC_ID",
    "Complaint_Date",
    "Issue_Description",
    "Technician_Name",
    "Action_Taken",
    "Cost_Type",
    "Cost_Amount",
    "Complaint_Status",
    "Notes",
  ]);
}

function getFilterTitle(filter) {
  if (filter === "open") return "Complaints Needing Action";
  if (filter === "only-open") return "Open Complaints";
  if (filter === "in-progress") return "Complaints In Progress";
  if (filter === "completed") return "Completed Complaints";
  if (filter === "cancelled") return "Cancelled Complaints";
  if (filter === "paid") return "Paid Repair Complaints";
  if (filter === "free") return "Free Repair Complaints";
  return "All Complaints";
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

function getCostTypeClass(type) {
  if (!type) return "";

  const v = String(type).toLowerCase();

  if (v === "free") return "status-active";
  if (v === "paid") return "status-info";

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

export default Complaints;
