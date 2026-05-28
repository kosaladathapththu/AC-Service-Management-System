import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getAllData, updateRecord } from "../api/googleSheetApi";
import {
  formatCustomerDisplay,
  getRecordCustomerName,
} from "../utils/customerDisplay";
import { recordMatchesSearch } from "../utils/recordSearch";

function ACUnits() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFilter = searchParams.get("filter") || "all";

  const [acUnits, setAcUnits] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [editingUnit, setEditingUnit] = useState(null);
  const [editFormData, setEditFormData] = useState({
    AC_Model: "",
    Serial_Number: "",
    Quantity: "",
    Price: "",
    Purchase_Date: "",
    Sales_Channel: "Showroom",
    Warranty_Start_Date: "",
    Warranty_End_Date: "",
    Warranty_Status: "Active",
  });

  useEffect(() => {
    loadACUnits();
  }, []);

  async function loadACUnits() {
    try {
      setLoading(true);
      setError("");

      const [acUnitsData, customersData] = await Promise.all([
        getAllData("acUnits"),
        getAllData("customers"),
      ]);

      setAcUnits(acUnitsData);
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

  const filteredACUnits = acUnits.filter((unit) => {
    const warrantyStatus = String(unit.Warranty_Status || "").toLowerCase();
    const salesChannel = String(unit.Sales_Channel || "").toLowerCase();

    if (!acUnitMatchesSearch(unit, customers, searchQuery)) return false;

    if (activeFilter === "active-warranty") {
      return warrantyStatus === "active";
    }

    if (activeFilter === "cancelled-warranty") {
      return warrantyStatus === "cancelled";
    }

    if (activeFilter === "expired-warranty") {
      return warrantyStatus === "expired";
    }

    if (activeFilter === "showroom") {
      return salesChannel === "showroom";
    }

    if (activeFilter === "online") {
      return salesChannel === "online";
    }

    return true;
  });
  const acUnitCustomerGroups = getACUnitCustomerGroups(filteredACUnits, customers);

  function toggleExpand(acId) {
    setExpandedId((prev) => (prev === acId ? null : acId));
  }

  function openEditModal(unit) {
    setEditingUnit(unit);

    setEditFormData({
      AC_Model: unit.AC_Model || "",
      Serial_Number: unit.Serial_Number || "",
      Quantity: unit.Quantity || "",
      Price: unit.Price || "",
      Purchase_Date: formatDateForInput(unit.Purchase_Date),
      Sales_Channel: unit.Sales_Channel || "Showroom",
      Warranty_Start_Date: formatDateForInput(unit.Warranty_Start_Date),
      Warranty_End_Date: formatDateForInput(unit.Warranty_End_Date),
      Warranty_Status: unit.Warranty_Status || "Active",
    });
  }

  function closeEditModal() {
    setEditingUnit(null);

    setEditFormData({
      AC_Model: "",
      Serial_Number: "",
      Quantity: "",
      Price: "",
      Purchase_Date: "",
      Sales_Channel: "Showroom",
      Warranty_Start_Date: "",
      Warranty_End_Date: "",
      Warranty_Status: "Active",
    });
  }

  function handleEditChange(event) {
    const { name, value } = event.target;

    setEditFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUpdateACUnit(event) {
    event.preventDefault();

    if (!editingUnit) return;

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      await updateRecord("acUnits", "AC_ID", editingUnit.AC_ID, editFormData);

      setSuccessMessage("AC unit updated successfully.");
      closeEditModal();
      await loadACUnits();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading AC units...</p>;

  return (
    <div className="ac-units-page">
      <div className="page-header">
        <h2>AC Units</h2>
        <p>
          Manage all sold AC units and warranty details. Click a record to
          expand details.
        </p>
      </div>

      {error && <p className="error-text">Error: {error}</p>}
      {successMessage && <p className="success-text">{successMessage}</p>}

      <div className="ac-filter-panel">
        <div>
          <h3>{getFilterTitle(activeFilter)}</h3>
          <p>{filteredACUnits.length} AC unit record(s) found</p>
        </div>

        <div className="ac-filter-actions">
          <button
            className={
              activeFilter === "all" ? "ac-filter-btn active" : "ac-filter-btn"
            }
            onClick={() => changeFilter("all")}
          >
            All
          </button>

          <button
            className={
              activeFilter === "active-warranty"
                ? "ac-filter-btn active success"
                : "ac-filter-btn"
            }
            onClick={() => changeFilter("active-warranty")}
          >
            Active Warranty
          </button>

          <button
            className={
              activeFilter === "cancelled-warranty"
                ? "ac-filter-btn active danger"
                : "ac-filter-btn"
            }
            onClick={() => changeFilter("cancelled-warranty")}
          >
            Cancelled
          </button>

          <button
            className={
              activeFilter === "expired-warranty"
                ? "ac-filter-btn active warning"
                : "ac-filter-btn"
            }
            onClick={() => changeFilter("expired-warranty")}
          >
            Expired
          </button>

          <button
            className={
              activeFilter === "showroom"
                ? "ac-filter-btn active"
                : "ac-filter-btn"
            }
            onClick={() => changeFilter("showroom")}
          >
            Showroom
          </button>

          <button
            className={
              activeFilter === "online"
                ? "ac-filter-btn active"
                : "ac-filter-btn"
            }
            onClick={() => changeFilter("online")}
          >
            Online
          </button>
        </div>
      </div>

      <div className="record-search-panel">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search AC units by customer, AC ID, model, serial, warranty..."
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery("")}>
            Clear
          </button>
        )}
      </div>

      <div className="customer-record-groups">
        {filteredACUnits.length === 0 && (
          <div className="empty-list-card">
            <p>No AC unit records found for this filter.</p>
            <button
              className="ac-filter-btn active"
              onClick={() => changeFilter("all")}
            >
              Show All AC Units
            </button>
          </div>
        )}

        {acUnitCustomerGroups.map((group) => (
          <section key={group.key} className="customer-record-card">
            <div className="customer-record-card-header">
              <div>
                <h3>{group.title}</h3>
                <p>{group.description}</p>
              </div>
              <div className="customer-record-status-counts">
                {group.statusCounts.active > 0 && (
                  <span className="status-badge status-active">
                    {group.statusCounts.active} Active
                  </span>
                )}
                {group.statusCounts.expired > 0 && (
                  <span className="status-badge status-info">
                    {group.statusCounts.expired} Expired
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
              {group.acUnits.map((unit, index) => {
          const id = unit.AC_ID || `${group.key}-${index}`;
          const isExpanded = expandedId === id;
          const customerName = getRecordCustomerName(unit, customers);

          return (
            <div key={id} className="customer-record-row">
              <div
                className="record-card-main"
                onClick={() => toggleExpand(id)}
              >
                <span className="record-id-badge">{unit.AC_ID || "—"}</span>

                <div className="record-summary">
                  <div className="record-primary-row">
                    <span className="record-customer-id">
                      {formatCustomerDisplay(unit.Customer_ID, customerName)}
                    </span>

                    <span className="record-separator">·</span>

                    <span className="record-ac-id">
                      {unit.AC_Model || "—"}
                    </span>

                    <span className="record-separator">·</span>

                    <span className="record-amount">
                      {formatPrice(unit.Price)}
                    </span>

                    <span className="record-separator">·</span>

                    <span className="record-date">
                      Purchased: {formatDate(unit.Purchase_Date)}
                    </span>
                  </div>

                  <div className="record-badge-row">
                    <span
                      className={`status-badge ${getStatusClass(
                        unit.Warranty_Status
                      )}`}
                    >
                      {unit.Warranty_Status || "—"}
                    </span>

                    {unit.Sales_Channel && (
                      <span className="status-badge status-neutral">
                        {unit.Sales_Channel}
                      </span>
                    )}

                    {unit.Quantity && (
                      <span className="status-badge status-neutral">
                        Qty: {unit.Quantity}
                      </span>
                    )}

                    <span
                      className="record-date"
                      style={{ fontSize: "12px", color: "#6B7280" }}
                    >
                      Warranty: {formatDate(unit.Warranty_Start_Date)} –{" "}
                      {formatDate(unit.Warranty_End_Date)}
                    </span>
                  </div>
                </div>

                <div
                  className="record-actions"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    className="edit-btn"
                    onClick={() => openEditModal(unit)}
                  >
                    Edit
                  </button>

                  <Link
                    className="view-link"
                    to={`/customers/${unit.Customer_ID}`}
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
                      <label>AC Model</label>
                      <span>{unit.AC_Model || "—"}</span>
                    </div>

                    <div className="detail-item">
                      <label>Serial Number</label>
                      <span>{unit.Serial_Number || "—"}</span>
                    </div>

                    <div className="detail-item">
                      <label>Quantity</label>
                      <span>{unit.Quantity || "—"}</span>
                    </div>

                    <div className="detail-item">
                      <label>Price</label>
                      <span>{formatPrice(unit.Price)}</span>
                    </div>

                    <div className="detail-item">
                      <label>Purchase Date</label>
                      <span>{formatDate(unit.Purchase_Date)}</span>
                    </div>

                    <div className="detail-item">
                      <label>Sales Channel</label>
                      <span>{unit.Sales_Channel || "—"}</span>
                    </div>

                    <div className="detail-item">
                      <label>Warranty Start</label>
                      <span>{formatDate(unit.Warranty_Start_Date)}</span>
                    </div>

                    <div className="detail-item">
                      <label>Warranty End</label>
                      <span>{formatDate(unit.Warranty_End_Date)}</span>
                    </div>

                    <div className="detail-item">
                      <label>Warranty Status</label>
                      <span
                        className={`status-badge ${getStatusClass(
                          unit.Warranty_Status
                        )}`}
                      >
                        {unit.Warranty_Status || "—"}
                      </span>
                    </div>
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

      {editingUnit && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit AC Unit</h3>
              <button className="close-btn" onClick={closeEditModal}>
                ×
              </button>
            </div>

            <p className="modal-subtitle">
              AC ID: <strong>{editingUnit.AC_ID}</strong> | Customer ID:{" "}
              <strong>{editingUnit.Customer_ID}</strong>
            </p>

            <form onSubmit={handleUpdateACUnit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>AC Model</label>
                  <input
                    type="text"
                    name="AC_Model"
                    value={editFormData.AC_Model}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Serial Number</label>
                  <input
                    type="text"
                    name="Serial_Number"
                    value={editFormData.Serial_Number}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    name="Quantity"
                    value={editFormData.Quantity}
                    onChange={handleEditChange}
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Price</label>
                  <input
                    type="number"
                    name="Price"
                    value={editFormData.Price}
                    onChange={handleEditChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Purchase Date</label>
                  <input
                    type="date"
                    name="Purchase_Date"
                    value={editFormData.Purchase_Date}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Sales Channel</label>
                  <select
                    name="Sales_Channel"
                    value={editFormData.Sales_Channel}
                    onChange={handleEditChange}
                  >
                    <option value="Showroom">Showroom</option>
                    <option value="Online">Online</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Warranty Start Date</label>
                  <input
                    type="date"
                    name="Warranty_Start_Date"
                    value={editFormData.Warranty_Start_Date}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Warranty End Date</label>
                  <input
                    type="date"
                    name="Warranty_End_Date"
                    value={editFormData.Warranty_End_Date}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Warranty Status</label>
                  <select
                    name="Warranty_Status"
                    value={editFormData.Warranty_Status}
                    onChange={handleEditChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Expired">Expired</option>
                  </select>
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
                  {saving ? "Updating..." : "Update AC Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function acUnitMatchesSearch(unit, customers, query) {
  return recordMatchesSearch(unit, customers, query, [
    "AC_ID",
    "Customer_ID",
    "AC_Model",
    "Serial_Number",
    "Quantity",
    "Price",
    "Purchase_Date",
    "Sales_Channel",
    "Warranty_Start_Date",
    "Warranty_End_Date",
    "Warranty_Status",
  ]);
}

function getACUnitCustomerGroups(acUnits, customers) {
  const groupMap = new Map();

  acUnits.forEach((unit) => {
    const customerId = unit.Customer_ID || "-";
    const customerName = getRecordCustomerName(unit, customers);
    const key = String(customerId).trim() || "unknown-customer";

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        title: formatCustomerDisplay(customerId, customerName),
        description: "",
        acUnits: [],
        statusCounts: {
          active: 0,
          expired: 0,
          cancelled: 0,
        },
      });
    }

    const group = groupMap.get(key);
    group.acUnits.push(unit);

    const status = String(unit.Warranty_Status || "").toLowerCase().trim();
    if (group.statusCounts[status] !== undefined) {
      group.statusCounts[status] += 1;
    }
  });

  return Array.from(groupMap.values()).map((group) => ({
    ...group,
    description: `${group.acUnits.length} AC unit${
      group.acUnits.length === 1 ? "" : "s"
    } for this customer`,
  }));
}

function getFilterTitle(filter) {
  if (filter === "active-warranty") return "Active Warranty AC Units";
  if (filter === "cancelled-warranty") return "Cancelled Warranty AC Units";
  if (filter === "expired-warranty") return "Expired Warranty AC Units";
  if (filter === "showroom") return "Showroom Sales";
  if (filter === "online") return "Online Sales";
  return "All AC Units";
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

function getStatusClass(status) {
  if (!status) return "";

  const v = String(status).toLowerCase();

  if (v === "active") return "status-active";
  if (v === "cancelled") return "status-cancelled";
  if (v === "expired") return "status-expired";

  return "";
}

export default ACUnits;
