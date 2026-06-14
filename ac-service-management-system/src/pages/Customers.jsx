import { useEffect, useMemo, useRef, useState } from "react";
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
  const [searchField, setSearchField] = useState("all");
  const [selectedChannel, setSelectedChannel] = useState("all");
  const customersTopRef = useRef(null);

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
    const primarySalesChannel = getPrimaryCustomerSalesChannel(
      customer,
      getCustomerACUnits(customer, acUnits)
    );

    setEditingCustomer(customer);
    setEditFormData({
      Customer_Name: customer.Customer_Name || "",
      Phone: customer.Phone || "",
      Email: customer.Email || "",
      Address: customer.Address || "",
      Google_Map_Link: customer.Google_Map_Link || customer.Google_Map_Li || "",
      Created_Date: formatDateForInput(customer.Created_Date),
      Notes: customer.Notes || "",
      Sales_Channel: primarySalesChannel === "Unknown" ? "Showroom" : primarySalesChannel,
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
    const value = getRawValue(row, keys);
    return value || "-";
  }

  function getRawValue(row, keys) {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
        return row[key];
      }
    }
    return "";
  }

  const customerRows = useMemo(
    () =>
      customers.map((customer) => {
        const customerUnits = getCustomerACUnits(customer, acUnits);
        const primarySalesChannel = getPrimaryCustomerSalesChannel(customer, customerUnits);
        const salesChannels = getCustomerSalesChannels(customer, customerUnits);

        return {
          customer,
          customerUnits,
          primarySalesChannel,
          salesChannels,
          searchText: buildCustomerSearchText(customer, customerUnits),
          searchFields: buildCustomerSearchFields(customer, customerUnits),
          phoneText: buildCustomerPhoneSearchText(customer, customerUnits),
        };
      }),
    [customers, acUnits]
  );

  function getFilteredCustomerRows() {
    const normalizedQuery = normalizeSearchText(searchQuery);
    const filterChannel = String(selectedChannel || "all").toLowerCase().trim();

    return customerRows.filter((row) => {
      const matchesSearch = customerMatchesSearch(row, normalizedQuery, searchField);
      const matchesChannel =
        filterChannel === "all" ||
        normalizeChannel(row.primarySalesChannel).toLowerCase() === filterChannel;

      return matchesSearch && matchesChannel;
    });
  }

  function handleChannelFilterChange(channel) {
    setSelectedChannel(channel);
    setSearchQuery("");
    setSearchField("all");
    setExpandedId(null);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      customersTopRef.current?.scrollIntoView({ block: "start" });
    });
  }

  if (loading) return <p>Loading customers...</p>;
  if (error) return <p className="error-text">Error: {error}</p>;

  const filteredCustomerRows = getFilteredCustomerRows();

  return (
    <div>
      <div className="page-header">
        <h2>Customers</h2>
        <p>Manage all customer records. Click a record to expand details.</p>
      </div>

      {successMessage && <p className="success-text">{successMessage}</p>}

      <div className="search-filter-section" ref={customersTopRef}>
        <div className="search-box customer-search-box">
          <select
            value={searchField}
            onChange={(e) => {
              setSearchField(e.target.value);
              setExpandedId(null);
            }}
            className="search-field-select"
            aria-label="Search by"
          >
            <option value="all">All Fields</option>
            <option value="customer">Customer Name</option>
            <option value="phone">Phone</option>
            <option value="address">Address</option>
            <option value="invoice">Invoice</option>
            <option value="model">AC Model</option>
            <option value="serial">Serial Number</option>
            <option value="id">Customer ID</option>
          </select>
          <input
            type="text"
            placeholder={getSearchPlaceholder(searchField)}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setExpandedId(null);
            }}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <button
            type="button"
            className={`filter-btn ${selectedChannel === "all" ? "active" : ""}`}
            onClick={() => handleChannelFilterChange("all")}
          >
            All Customers
          </button>
          <button
            type="button"
            className={`filter-btn ${selectedChannel === "showroom" ? "active" : ""}`}
            onClick={() => handleChannelFilterChange("showroom")}
          >
            Showroom
          </button>
          <button
            type="button"
            className={`filter-btn ${selectedChannel === "online" ? "active" : ""}`}
            onClick={() => handleChannelFilterChange("online")}
          >
            Online
          </button>
        </div>
      </div>

      <div className="customer-result-summary">
        Showing {filteredCustomerRows.length} {getSelectedChannelLabel(selectedChannel)} customers
      </div>

      <div className="record-list" key={`${selectedChannel}-${searchField}-${searchQuery}`}>
        {filteredCustomerRows.length === 0 && <p className="empty-list">No customers found.</p>}

        {filteredCustomerRows.map((row, index) => {
          const { customer, customerUnits, primarySalesChannel, salesChannels } = row;
          const customerId = getValue(customer, ["Customer_ID", "customer_ID", "Customer ID", "id"]);
          const customerName = getValue(customer, ["Customer_Name", "Customer Name", "name"]);
          const phone = getValue(customer, ["Phone", "phone"]);
          const email = getValue(customer, ["Email", "email"]);
          const address = getValue(customer, ["Address", "address"]);
          const googleMapLink = getValue(customer, ["Google_Map_Link", "Google_Map_Li", "Google Map Link", "googleMapLink"]);
          const createdDate = getValue(customer, ["Created_Date", "Created Date", "createdDate"]);
          const notes = getValue(customer, ["Notes", "notes"]);
          const salesChannelLabel = salesChannels.join(", ");
          const salesChannelClass = normalizeChannel(primarySalesChannel).toLowerCase() || "unknown";

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
                  <div className="record-badge-row">
                    {address !== "-" && (
                      <span className="record-issue-preview">{address}</span>
                    )}
                    <span className={`customer-type-badge ${salesChannelClass}`}>
                      {salesChannelLabel}
                    </span>
                  </div>
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
                      <span className={`customer-type-badge ${salesChannelClass}`}>
                        {salesChannelLabel}
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

function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
}

function formatDateForInput(value) {
  if (!value || value === "-") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

function getCustomerId(customer) {
  return (
    customer.Customer_ID ||
    customer.customer_ID ||
    customer["Customer ID"] ||
    customer.id ||
    ""
  );
}

function getCustomerACUnits(customer, acUnits) {
  const customerId = normalizeValue(getCustomerId(customer));

  if (!customerId) return [];

  return acUnits.filter(
    (unit) => normalizeValue(unit.Customer_ID || unit["Customer ID"]) === customerId
  );
}

function getCustomerSalesChannels(customer, customerUnits) {
  const channelValues = [
    customer.Sales_Channel,
    customer.sales_channel,
    customer.Customer_Source,
    customer.customer_source,
    customer.Source,
    customer.source,
    ...customerUnits.map((unit) => unit.Sales_Channel || unit.sales_channel),
  ];

  const channels = [];

  channelValues.forEach((value) => {
    const channel = normalizeChannel(value);
    if (channel && !channels.includes(channel)) {
      channels.push(channel);
    }
  });

  return channels.length > 0 ? channels : ["Unknown"];
}

function getPrimaryCustomerSalesChannel(customer, customerUnits) {
  return getCustomerSalesChannels(customer, customerUnits)[0] || "Unknown";
}

function normalizeChannel(value) {
  const text = String(value || "").trim().toLowerCase();

  if (!text || text === "-") return "";
  if (text.includes("online")) return "Online";
  if (text.includes("showroom") || text.includes("show room")) return "Showroom";

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildCustomerSearchText(customer, customerUnits) {
  return normalizeSearchText([
    ...Object.values(customer || {}),
    ...customerUnits.flatMap((unit) => Object.values(unit || {})),
  ].join(" "));
}

function buildCustomerSearchFields(customer, customerUnits) {
  return {
    id: normalizeSearchText([
      customer.Customer_ID,
      customer.customer_ID,
      customer["Customer ID"],
      customer.id,
      ...customerUnits.flatMap((unit) => [unit.Customer_ID, unit.AC_ID]),
    ].join(" ")),
    customer: normalizeSearchText([
      customer.Customer_Name,
      customer["Customer Name"],
      customer.name,
      customer.Name,
    ].join(" ")),
    phone: buildCustomerPhoneSearchText(customer, customerUnits),
    address: normalizeSearchText([
      customer.Address,
      customer.address,
      customer.Google_Map_Link,
      customer.Google_Map_Li,
      customer["Google Map Link"],
    ].join(" ")),
    invoice: normalizeSearchText(
      customerUnits
        .flatMap((unit) => [
          unit.Invoice_Number,
          unit["Invoice Number"],
          unit.invoiceNumber,
        ])
        .join(" ")
    ),
    model: normalizeSearchText(
      customerUnits
        .flatMap((unit) => [
          unit.AC_Model,
          unit["AC Model"],
          unit.Model,
          unit.model,
        ])
        .join(" ")
    ),
    serial: normalizeSearchText(
      customerUnits
        .flatMap((unit) => [
          unit.Serial_Number,
          unit["Serial Number"],
          unit.serialNumber,
        ])
        .join(" ")
    ),
  };
}

function buildCustomerPhoneSearchText(customer, customerUnits) {
  const phones = [
    ...getPhoneValues(customer),
    ...customerUnits.flatMap(getPhoneValues),
  ];

  return phones
    .flatMap(getNormalizedPhoneCandidates)
    .filter(Boolean)
    .join(" ");
}

function customerMatchesSearch(row, normalizedQuery, searchField) {
  if (!normalizedQuery) return true;

  if (searchField === "phone") {
    return getNormalizedPhoneCandidates(normalizedQuery).some(
      (phone) => phone.length >= 3 && row.phoneText.includes(phone)
    );
  }

  if (searchField !== "all") {
    const fieldText = row.searchFields[searchField] || "";
    return normalizedQuery
      .split(" ")
      .filter(Boolean)
      .every((term) => fieldText.includes(term));
  }

  const searchTerms = normalizedQuery.split(" ").filter(Boolean);
  const textMatches = searchTerms.every((term) => row.searchText.includes(term));
  const phoneMatches = getNormalizedPhoneCandidates(normalizedQuery).some(
    (phone) => phone.length >= 3 && row.phoneText.includes(phone)
  );

  return textMatches || phoneMatches;
}

function getSearchPlaceholder(searchField) {
  const placeholders = {
    all: "Search all customer and AC fields...",
    customer: "Search customer name...",
    phone: "Search phone number...",
    address: "Search address or map link...",
    invoice: "Search invoice number...",
    model: "Search AC model...",
    serial: "Search serial number...",
    id: "Search customer ID or AC ID...",
  };

  return placeholders[searchField] || placeholders.all;
}

function getSelectedChannelLabel(selectedChannel) {
  if (selectedChannel === "online") return "Online";
  if (selectedChannel === "showroom") return "Showroom";
  return "all";
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(value) {
  return getNormalizedPhoneCandidates(value)[0] || "";
}

function getPhoneValues(record) {
  return Object.entries(record || {})
    .filter(([key]) => {
      const normalizedKey = normalizeSearchText(key).replace(/[_-]/g, " ");
      return (
        normalizedKey.includes("phone") ||
        normalizedKey.includes("contact") ||
        normalizedKey.includes("mobile") ||
        normalizedKey.includes("telephone") ||
        normalizedKey === "tel"
      );
    })
    .map(([, value]) => value)
    .filter((value) => value !== undefined && value !== null && value !== "");
}

function getNormalizedPhoneCandidates(value) {
  const text = String(value || "").trim();

  if (!text) return [];

  if (/[eE]/.test(text) && !Number.isNaN(Number(text))) {
    const numericPhone = String(Math.trunc(Number(text)));
    return [normalizePhoneDigits(numericPhone)].filter(Boolean);
  }

  const candidates = text.match(/\d{7,12}/g) || [];
  const compactDigits = text.replace(/\D/g, "");
  const phoneCandidates = [...candidates, compactDigits];

  return Array.from(
    new Set(
      phoneCandidates
        .flatMap(getPhoneSearchVariants)
        .filter(Boolean)
    )
  );
}

function getPhoneSearchVariants(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return [];

  const variants = new Set();
  const normalized = normalizePhoneDigits(digits);

  if (normalized) {
    variants.add(normalized);
    variants.add(normalized.replace(/^0+/, ""));
    if (normalized.length === 9 && normalized.startsWith("7")) {
      variants.add("0" + normalized);
    }
  }

  variants.add(digits);
  variants.add(digits.replace(/^0+/, ""));

  return Array.from(variants);
}

function normalizePhoneDigits(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  let phone = digits;

  if (phone.startsWith("0094") && phone.length > 9) {
    phone = phone.slice(4);
  } else if (phone.startsWith("94") && phone.length > 9) {
    phone = phone.slice(2);
  } else if (phone.startsWith("0")) {
    phone = phone.replace(/^0+/, "");
  }

  return phone.length > 9 ? phone.slice(-9) : phone;
}

export default Customers;
