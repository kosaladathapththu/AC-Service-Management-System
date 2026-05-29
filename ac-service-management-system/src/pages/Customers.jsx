import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllData, updateRecord } from "../api/googleSheetApi";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [acUnits, setAcUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("all");

  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editFormData, setEditFormData] = useState({
    Customer_Name: "",
    Phone: "",
    Email: "",
    Address: "",
    Google_Map_Link: "",
    Created_Date: "",
    Notes: "",
    Sales_Channel: "",
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");
      const [customersData, acUnitsData] = await Promise.all([
        getAllData("customers"),
        getAllData("acUnits"),
      ]);
      setCustomers(customersData);
      setAcUnits(acUnitsData);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(customerId) {
    setExpandedId((prev) => (prev === customerId ? null : customerId));
  }

  function openEditModal(customer) {
    setEditingCustomer(customer);
    setEditFormData({
      Customer_Name: customer.Customer_Name || "",
      Phone: customer.Phone || "",
      Email: customer.Email || "",
      Address: customer.Address || "",
      Google_Map_Link: customer.Google_Map_Link || customer.Google_Map_Li || "",
      Created_Date: formatDateForInput(customer.Created_Date),
      Notes: customer.Notes || "",
      Sales_Channel: getCustomerSalesChannel(customer, acUnits),
    });
  }

  function closeEditModal() {
    setEditingCustomer(null);
    setEditFormData({
      Customer_Name: "",
      Phone: "",
      Email: "",
      Address: "",
      Google_Map_Link: "",
      Created_Date: "",
      Notes: "",
      Sales_Channel: "",
    });
  }

  function handleEditChange(event) {
    const { name, value } = event.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUpdateCustomer(event) {
    event.preventDefault();
    if (!editingCustomer) return;

    const customerId = getValue(editingCustomer, [
      "Customer_ID", "customer_ID", "Customer ID", "id",
    ]);

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");
      await updateRecord("customers", "Customer_ID", customerId, editFormData);
      await updateCustomerACUnitSalesChannels(
        customerId,
        editFormData.Sales_Channel,
        acUnits
      );
      setSuccessMessage("Customer updated successfully.");
      closeEditModal();
      await loadCustomers();
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }

  function getValue(row, keys) {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
        return row[key];
      }
    }
    return "-";
  }

  function getFilteredCustomers() {
    return customers.filter((customer) => {
      const customerName = String(getValue(customer, ["Customer_Name", "Customer Name", "name"]) || "").toLowerCase();
      const phone = String(getValue(customer, ["Phone", "phone"]) || "").toLowerCase();
      const cleanSearchQuery = String(searchQuery || "").toLowerCase();
      const searchDigits = String(searchQuery || "").replace(/\D/g, "");
      const searchPhone = normalizePhoneSearchQuery(searchQuery);
      const customerPhone = normalizePhone(phone);
      
      const salesChannel = getCustomerSalesChannel(customer, acUnits)
        .toLowerCase()
        .trim();

      // Check if search query matches
      const matchesSearch =
        !searchQuery ||
        customerName.includes(cleanSearchQuery) ||
        phone.includes(cleanSearchQuery) ||
        (searchPhone.length >= 1 && customerPhone.includes(searchPhone)) ||
        (searchDigits && /^0+$/.test(searchDigits) && customerPhone !== "");

      // Check if channel filter matches
      const filterChannel = String(selectedChannel).toLowerCase().trim();
      const matchesChannel =
        filterChannel === "all" ||
        salesChannel === filterChannel;

      return matchesSearch && matchesChannel;
    });
  }

  if (loading) return <p>Loading customers...</p>;
  if (error) return <p className="error-text">Error: {error}</p>;

  const filteredCustomers = getFilteredCustomers();

  return (
    <div>
      <div className="page-header">
        <h2>Customers</h2>
        <p>Manage all customer records. Click a record to expand details.</p>
      </div>

      {successMessage && <p className="success-text">{successMessage}</p>}

      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${selectedChannel === "all" ? "active" : ""}`}
            onClick={() => setSelectedChannel("all")}
          >
            All Customers
          </button>
          <button
            className={`filter-btn ${selectedChannel === "showroom" ? "active" : ""}`}
            onClick={() => setSelectedChannel("showroom")}
          >
            Showroom
          </button>
          <button
            className={`filter-btn ${selectedChannel === "online" ? "active" : ""}`}
            onClick={() => setSelectedChannel("online")}
          >
            Online
          </button>
        </div>
      </div>

      <div className="record-list">
        {filteredCustomers.length === 0 && <p className="empty-list">No customers found.</p>}

        {filteredCustomers.map((customer, index) => {
          const customerId = getValue(customer, ["Customer_ID", "customer_ID", "Customer ID", "id"]);
          const customerName = getValue(customer, ["Customer_Name", "Customer Name", "name"]);
          const phone = getValue(customer, ["Phone", "phone"]);
          const email = getValue(customer, ["Email", "email"]);
          const address = getValue(customer, ["Address", "address"]);
          const googleMapLink = getValue(customer, ["Google_Map_Link", "Google_Map_Li", "Google Map Link", "googleMapLink"]);
          const createdDate = getValue(customer, ["Created_Date", "Created Date", "createdDate"]);
          const notes = getValue(customer, ["Notes", "notes"]);
          const salesChannel = getCustomerSalesChannel(customer, acUnits);

          const id = customerId !== "-" ? customerId : index;
          const isExpanded = expandedId === id;

          return (
            <div key={id} className="record-card">
              <div className="record-card-main" onClick={() => toggleExpand(id)}>
                <span className="record-id-badge">{customerId !== "-" ? customerId : "—"}</span>

                <div className="record-summary">
                  <div className="record-primary-row">
                    <span className="record-customer-id">{customerName}</span>
                    {phone !== "-" && (
                      <>
                        <span className="record-separator">·</span>
                        <span className="record-ac-id">{phone}</span>
                      </>
                    )}
                    {email !== "-" && (
                      <>
                        <span className="record-separator">·</span>
                        <span className="record-ac-id">{email}</span>
                      </>
                    )}
                  </div>
                  {address !== "-" && (
                    <div className="record-badge-row">
                      <span className="record-issue-preview">{address}</span>
                    </div>
                  )}
                </div>

                <div className="record-actions" onClick={(e) => e.stopPropagation()}>
                  {customerId !== "-" && (
                    <Link className="profile-btn" to={`/customers/${customerId}`}>
                      Profile
                    </Link>
                  )}
                  <button className="edit-btn" onClick={() => openEditModal(customer)}>
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
                      <label>Phone</label>
                      <span>{phone !== "-" ? phone : "—"}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email</label>
                      <span>{email !== "-" ? email : "—"}</span>
                    </div>
                    <div className="detail-item">
                      <label>Customer Type</label>
                      <span className={`customer-type-badge ${salesChannel.toLowerCase()}`}>
                        {salesChannel}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Created Date</label>
                      <span>{formatDate(createdDate)}</span>
                    </div>
                    <div className="detail-item detail-full">
                      <label>Address</label>
                      <span>{address !== "-" ? address : "—"}</span>
                    </div>
                    {googleMapLink !== "-" && (
                      <div className="detail-item">
                        <label>Google Map</label>
                        <span>
                          <a href={googleMapLink} target="_blank" rel="noreferrer" className="view-link">
                            Open Map
                          </a>
                        </span>
                      </div>
                    )}
                    {notes !== "-" && (
                      <div className="detail-item detail-full">
                        <label>Notes</label>
                        <span>{notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingCustomer && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Customer</h3>
              <button className="close-btn" onClick={closeEditModal}>×</button>
            </div>
            <p className="modal-subtitle">
              Customer ID:{" "}
              <strong>
                {getValue(editingCustomer, ["Customer_ID", "customer_ID", "Customer ID", "id"])}
              </strong>
            </p>
            <form onSubmit={handleUpdateCustomer}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Customer Name</label>
                  <input type="text" name="Customer_Name" value={editFormData.Customer_Name} onChange={handleEditChange} required />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input type="text" name="Phone" value={editFormData.Phone} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" name="Email" value={editFormData.Email} onChange={handleEditChange} />
                </div>
                <div className="form-group">
                  <label>Customer Type</label>
                  <select name="Sales_Channel" value={editFormData.Sales_Channel} onChange={handleEditChange}>
                    <option value="Showroom">Showroom</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Created Date</label>
                  <input type="date" name="Created_Date" value={editFormData.Created_Date} onChange={handleEditChange} />
                </div>
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea name="Address" value={editFormData.Address} onChange={handleEditChange} rows="3"></textarea>
                </div>
                <div className="form-group full-width">
                  <label>Google Map Link</label>
                  <input type="text" name="Google_Map_Link" value={editFormData.Google_Map_Link} onChange={handleEditChange} placeholder="Paste Google Map link here" />
                </div>
                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea name="Notes" value={editFormData.Notes} onChange={handleEditChange} rows="3"></textarea>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={closeEditModal}>Cancel</button>
                <button type="submit" disabled={saving}>{saving ? "Updating..." : "Update Customer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(value) {
  if (!value || value === "-") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB");
}

async function updateCustomerACUnitSalesChannels(customerId, salesChannel, acUnits) {
  const matchingUnits = acUnits.filter(
    (unit) => normalizeValue(unit.Customer_ID) === normalizeValue(customerId)
  );

  await Promise.all(
    matchingUnits.map((unit) =>
      updateRecord("acUnits", "AC_ID", unit.AC_ID, {
        Sales_Channel: salesChannel,
      })
    )
  );
}

function getCustomerSalesChannel(customer, acUnits) {
  const customerChannel = customer.Sales_Channel || customer.sales_channel;

  if (customerChannel && customerChannel !== "-") {
    return customerChannel;
  }

  const customerId =
    customer.Customer_ID || customer.customer_ID || customer["Customer ID"] || customer.id;
  const matchingUnit = acUnits.find(
    (unit) => normalizeValue(unit.Customer_ID) === normalizeValue(customerId)
  );

  return matchingUnit?.Sales_Channel || "Showroom";
}

function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
}

function formatDateForInput(value) {
  if (!value || value === "-") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function normalizePhoneSearchQuery(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  let phone = digits;

  if (phone.startsWith("0094")) {
    phone = phone.slice(4);
  } else if (phone.startsWith("94")) {
    phone = phone.slice(2);
  }

  return phone.replace(/^0+/, "");
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  let phone = digits;

  if (phone.startsWith("0094") && phone.length > 9) {
    phone = phone.slice(4);
  } else if (phone.startsWith("94") && phone.length > 9) {
    phone = phone.slice(2);
  } else if (phone.startsWith("0") && phone.length > 9) {
    phone = phone.replace(/^0+/, "");
  }

  return phone.length > 9 ? phone.slice(-9) : phone;
}

export default Customers;
