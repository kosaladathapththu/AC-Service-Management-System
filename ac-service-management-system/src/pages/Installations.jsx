import { useEffect, useState } from "react";
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

function Installations() {
  const [installations, setInstallations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileLoadingId, setProfileLoadingId] = useState("");
  const [selectedProfile, setSelectedProfile] = useState(null);

  const [editingInstallation, setEditingInstallation] = useState(null);
  const [editFormData, setEditFormData] = useState({
    Installation_Date: "",
    Installation_Type: "In-house",
    Technician_Name: "",
    Outsource_Payment: "",
    Installation_Status: "Pending",
    Notes: "",
  });

  useEffect(() => {
    loadInstallations();
  }, []);

  async function loadInstallations() {
    try {
      setLoading(true);
      setError("");
      const [installationsData, customersData] = await Promise.all([
        getAllData("installations"),
        getAllData("customers"),
      ]);

      setInstallations(installationsData);
      setCustomers(customersData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(installationId) {
    setExpandedId((prev) => (prev === installationId ? null : installationId));
  }

  function openEditModal(installation) {
    setEditingInstallation(installation);
    setEditFormData({
      Installation_Date: formatDateForInput(installation.Installation_Date),
      Installation_Type: installation.Installation_Type || "In-house",
      Technician_Name: installation.Technician_Name || "",
      Outsource_Payment: installation.Outsource_Payment || "",
      Installation_Status: installation.Installation_Status || "Pending",
      Notes: installation.Notes || "",
    });
  }

  function closeEditModal() {
    setEditingInstallation(null);
    setEditFormData({
      Installation_Date: "",
      Installation_Type: "In-house",
      Technician_Name: "",
      Outsource_Payment: "",
      Installation_Status: "Pending",
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
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUpdateInstallation(event) {
    event.preventDefault();
    if (!editingInstallation) return;
    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");
      await updateRecord("installations", "Installation_ID", editingInstallation.Installation_ID, editFormData);
      setSuccessMessage("Installation updated successfully.");
      closeEditModal();
      await loadInstallations();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading installations...</p>;
  if (error) return <p className="error-text">Error: {error}</p>;

  const filteredInstallations = installations.filter((installation) =>
    installationMatchesSearch(installation, customers, searchQuery)
  );
  const installationCustomerGroups = getInstallationCustomerGroups(
    filteredInstallations,
    customers
  );

  return (
    <div>
      <div className="page-header">
        <h2>Installations</h2>
        <p>Manage AC installation records. Click a record to expand details.</p>
      </div>

      {successMessage && <p className="success-text">{successMessage}</p>}

      <div className="record-search-panel">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search installations by customer, AC, ID, status, technician..."
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery("")}>
            Clear
          </button>
        )}
      </div>

      <div className="customer-record-groups">
        {filteredInstallations.length === 0 && <p className="empty-list">No installation records found.</p>}

        {installationCustomerGroups.map((group) => (
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
                {group.statusCounts.completed > 0 && (
                  <span className="status-badge status-active">
                    {group.statusCounts.completed} Completed
                  </span>
                )}
                {group.statusCounts.cancelled > 0 && (
                  <span className="status-badge status-cancelled">
                    {group.statusCounts.cancelled} Cancelled
                  </span>
                )}
              </div>
            </div>

            <div className="customer-record-list">
              {group.installations.map((installation, index) => {
          const id = installation.Installation_ID || `${group.key}-${index}`;
          const isExpanded = expandedId === id;
          const customerName = getRecordCustomerName(installation, customers);

          return (
            <div key={id} className="customer-record-row">
              <div className="record-card-main" onClick={() => toggleExpand(id)}>
                <span className="record-id-badge">{installation.Installation_ID || "—"}</span>

                <div className="record-summary">
                  <div className="record-primary-row">
                    <span className="record-customer-id">{formatCustomerDisplay(installation.Customer_ID, customerName)}</span>
                    <span className="record-separator">·</span>
                    <span className="record-ac-id">AC: {installation.AC_ID || "—"}</span>
                    <span className="record-separator">·</span>
                    <span className="record-date">{formatDate(installation.Installation_Date)}</span>
                    {installation.Technician_Name && (
                      <>
                        <span className="record-separator">·</span>
                        <span className="record-tech">{installation.Technician_Name}</span>
                      </>
                    )}
                  </div>
                  <div className="record-badge-row">
                    <span className={`status-badge ${getInstallationStatusClass(installation.Installation_Status)}`}>
                      {installation.Installation_Status || "—"}
                    </span>
                    <span className={`status-badge ${getInstallationTypeClass(installation.Installation_Type)}`}>
                      {installation.Installation_Type || "—"}
                    </span>
                    {installation.Outsource_Payment && (
                      <span className="status-badge status-neutral">{formatPrice(installation.Outsource_Payment)}</span>
                    )}
                  </div>
                </div>

                <div className="record-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="edit-btn" onClick={() => openEditModal(installation)}>
                    Edit
                  </button>

                  <button
                    className="view-link"
                    type="button"
                    onClick={(event) =>
                      openProfileModal(installation.Customer_ID, event)
                    }
                    disabled={profileLoadingId === installation.Customer_ID}
                  >
                    {profileLoadingId === installation.Customer_ID
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
                      <label>Installation Date</label>
                      <span>{formatDate(installation.Installation_Date)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Installation Type</label>
                      <span>{installation.Installation_Type || "—"}</span>
                    </div>
                    <div className="detail-item">
                      <label>Technician</label>
                      <span>{installation.Technician_Name || "—"}</span>
                    </div>
                    <div className="detail-item">
                      <label>Outsource Payment</label>
                      <span>{formatPrice(installation.Outsource_Payment)}</span>
                    </div>
                    {installation.Notes && (
                      <div className="detail-item detail-full">
                        <label>Notes</label>
                        <span>{installation.Notes}</span>
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

      {editingInstallation && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Installation</h3>
              <button className="close-btn" onClick={closeEditModal}>×</button>
            </div>
            <p className="modal-subtitle">
              Installation ID: <strong>{editingInstallation.Installation_ID}</strong>
            </p>
            <form onSubmit={handleUpdateInstallation}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Installation Date</label>
                  <input type="date" name="Installation_Date" value={editFormData.Installation_Date} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Installation Type</label>
                  <select name="Installation_Type" value={editFormData.Installation_Type} onChange={handleEditChange}>
                    <option value="In-house">In-house</option>
                    <option value="Outsourced">Outsourced</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Technician Name</label>
                  <input type="text" name="Technician_Name" value={editFormData.Technician_Name} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Outsource Payment</label>
                  <input type="number" name="Outsource_Payment" value={editFormData.Outsource_Payment} onChange={handleEditChange} min="0" />
                </div>
                <div className="form-group">
                  <label>Installation Status</label>
                  <select name="Installation_Status" value={editFormData.Installation_Status} onChange={handleEditChange}>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea name="Notes" value={editFormData.Notes} onChange={handleEditChange} rows="3"></textarea>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={closeEditModal}>Cancel</button>
                <button type="submit" disabled={saving}>{saving ? "Updating..." : "Update Installation"}</button>
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

function installationMatchesSearch(installation, customers, query) {
  return recordMatchesSearch(installation, customers, query, [
    "Installation_ID",
    "Customer_ID",
    "AC_ID",
    "Installation_Date",
    "Installation_Type",
    "Technician_Name",
    "Outsource_Payment",
    "Installation_Status",
    "Notes",
  ]);
}

function getInstallationCustomerGroups(installations, customers) {
  const groupMap = new Map();

  installations.forEach((installation) => {
    const customerId = installation.Customer_ID || "-";
    const customerName = getRecordCustomerName(installation, customers);
    const key = String(customerId).trim() || "unknown-customer";

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        title: formatCustomerDisplay(customerId, customerName),
        description: "",
        installations: [],
        statusCounts: {
          pending: 0,
          completed: 0,
          cancelled: 0,
        },
      });
    }

    const group = groupMap.get(key);
    group.installations.push(installation);

    const status = String(installation.Installation_Status || "").toLowerCase().trim();
    if (group.statusCounts[status] !== undefined) {
      group.statusCounts[status] += 1;
    }
  });

  return Array.from(groupMap.values()).map((group) => ({
    ...group,
    description: `${group.installations.length} installation${
      group.installations.length === 1 ? "" : "s"
    } for this customer`,
  }));
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

export default Installations;
