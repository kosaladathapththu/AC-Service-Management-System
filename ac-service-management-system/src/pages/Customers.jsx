import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { getAllData, saveCustomerLocation, updateRecord } from "../api/googleSheetApi";
import { emptyLocationData } from "../utils/customerLocations";

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [acUnits, setAcUnits] = useState([]);
  const [locations, setLocations] = useState([]);
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
  const [editLocations, setEditLocations] = useState([]);
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
      const [customersData, acUnitsData, locationData] = await Promise.all([
        getAllData("customers"),
        getAllData("acUnits"),
        getAllData("customerLocations"),
      ]);
      setCustomers(customersData);
      setAcUnits(acUnitsData);
      setLocations(locationData);
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
    const customerId = getRawValue(customer, [
      "Customer_ID", "customer_ID", "Customer ID", "id",
    ]);
    setEditLocations(
      locations
        .filter(
          (location) => normalizeValue(location.Customer_ID) === normalizeValue(customerId)
        )
        .map((location) => ({ ...emptyLocationData(customerId), ...location }))
    );
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
    setEditLocations([]);
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

  function addEditLocation() {
    const customerId = getRawValue(editingCustomer, [
      "Customer_ID", "customer_ID", "Customer ID", "id",
    ]);
    setEditLocations((previous) => [
      ...previous,
      { ...emptyLocationData(customerId), _temporaryKey: `new-${Date.now()}` },
    ]);
  }

  function handleEditLocationChange(index, event) {
    const { name, value } = event.target;
    setEditLocations((previous) =>
      previous.map((location, locationIndex) => {
        if (name === "Is_Default" && value === "Yes") {
          return locationIndex === index
            ? { ...location, Is_Default: "Yes" }
            : { ...location, Is_Default: "No" };
        }

        return locationIndex === index ? { ...location, [name]: value } : location;
      })
    );
  }

  function discardUnsavedLocation(index) {
    setEditLocations((previous) =>
      previous.filter((_, locationIndex) => locationIndex !== index)
    );
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
      for (const location of editLocations) {
        await saveCustomerLocation({ ...location, Customer_ID: customerId });
      }
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
        const customerLocations = locations.filter(
          (location) => normalizeValue(location.Customer_ID) === normalizeValue(customer.Customer_ID)
        );

        return {
          customer,
          customerUnits,
          primarySalesChannel,
          salesChannels,
          customerLocations,
          searchText: buildCustomerSearchText(customer, customerUnits, customerLocations),
          searchFields: buildCustomerSearchFields(customer, customerUnits, customerLocations),
          phoneText: buildCustomerPhoneSearchText(customer, customerUnits, customerLocations),
        };
      }),
    [customers, acUnits, locations]
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
          const { customer, customerUnits, customerLocations, primarySalesChannel, salesChannels } = row;
          const customerId = getValue(customer, ["Customer_ID", "customer_ID", "Customer ID", "id"]);
          const customerName = getValue(customer, ["Customer_Name", "Customer Name", "name"]);
          const generatedNameInfo = getGeneratedCustomerNameInfo(customerName);
          const displayCustomerName = generatedNameInfo ? "Unnamed customer" : customerName;
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
                    <span className={`record-customer-id ${generatedNameInfo ? "record-muted-name" : ""}`}>
                      {displayCustomerName}
                    </span>
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
                    {generatedNameInfo && (
                      <span className="import-source-badge">
                        {generatedNameInfo.source} row {generatedNameInfo.row}
                      </span>
                    )}
                    <span className={`customer-type-badge ${salesChannelClass}`}>
                      {salesChannelLabel}
                    </span>
                    {customerLocations.length > 0 && (
                      <span className="status-neutral">{customerLocations.length} branch location(s)</span>
                    )}
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
                    {customerLocations.length > 0 && (
                      <div className="detail-item detail-full customer-branches-detail">
                        <label>Branches / Locations</label>
                        <div className="customer-branch-grid">
                          {customerLocations.map((location) => {
                            const branchUnits = customerUnitsForLocation(
                              customerUnits,
                              location.Location_ID
                            );

                            return (
                              <section className="customer-branch-card" key={location.Location_ID}>
                                <div className="customer-branch-card-header">
                                  <div>
                                    <h4>{location.Branch_Name || "Unnamed Branch"}</h4>
                                    <small>{location.Location_ID}</small>
                                  </div>
                                  <div className="record-badge-row">
                                    {isYesValue(location.Is_Default) && (
                                      <span className="status-badge status-info">Default</span>
                                    )}
                                    <span className={`status-badge ${normalizeValue(location.Status || "Active") === "inactive" ? "status-cancelled" : "status-active"}`}>
                                      {location.Status || "Active"}
                                    </span>
                                  </div>
                                </div>

                                <div className="customer-branch-fields">
                                  <div><strong>Contact Person</strong><span>{location.Contact_Person || "—"}</span></div>
                                  <div><strong>Phone</strong><span>{location.Phone || "—"}</span></div>
                                  <div className="customer-branch-address"><strong>Address</strong><span>{location.Address || "—"}</span></div>
                                  {location.Notes && <div className="customer-branch-address"><strong>Notes</strong><span>{location.Notes}</span></div>}
                                </div>

                                <div className="customer-branch-footer">
                                  <span>{branchUnits.length} AC record(s)</span>
                                  {branchUnits.length > 0 && (
                                    <span className="customer-branch-unit-list">
                                      {branchUnits.map((unit) => `${unit.AC_ID || "AC"}: ${unit.AC_Model || "Unknown model"}`).join(" · ")}
                                    </span>
                                  )}
                                  {location.Google_Map_Link && (
                                    <a href={location.Google_Map_Link} target="_blank" rel="noreferrer" className="view-link">
                                      Open Branch Map
                                    </a>
                                  )}
                                </div>
                              </section>
                            );
                          })}
                        </div>
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

              <div className="edit-customer-locations">
                <div className="edit-customer-locations-header">
                  <div>
                    <h4>Branches / Service Locations</h4>
                    <p>Optional. Add or update separate branch contact and address details.</p>
                  </div>
                  <button type="button" className="btn-secondary" onClick={addEditLocation}>
                    + Add Branch
                  </button>
                </div>

                {editLocations.length === 0 ? (
                  <p className="edit-customer-locations-empty">
                    No separate branches. This customer uses the main address above.
                  </p>
                ) : (
                  <div className="edit-location-list">
                    {editLocations.map((location, index) => (
                      <section
                        className="edit-location-card"
                        key={location.Location_ID || location._temporaryKey || index}
                      >
                        <div className="edit-location-card-header">
                          <div>
                            <strong>Branch {index + 1}</strong>
                            <small>{location.Location_ID || "New location"}</small>
                          </div>
                          {!location.Location_ID && (
                            <button
                              type="button"
                              className="cancel-btn"
                              onClick={() => discardUnsavedLocation(index)}
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="form-grid">
                          <div className="form-group">
                            <label>Branch Name *</label>
                            <input name="Branch_Name" value={location.Branch_Name} onChange={(event) => handleEditLocationChange(index, event)} required />
                          </div>
                          <div className="form-group">
                            <label>Contact Person</label>
                            <input name="Contact_Person" value={location.Contact_Person} onChange={(event) => handleEditLocationChange(index, event)} />
                          </div>
                          <div className="form-group">
                            <label>Branch Phone</label>
                            <input name="Phone" value={location.Phone} onChange={(event) => handleEditLocationChange(index, event)} />
                          </div>
                          <div className="form-group">
                            <label>Status</label>
                            <select name="Status" value={location.Status} onChange={(event) => handleEditLocationChange(index, event)}>
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          </div>
                          <div className="form-group full-width">
                            <label>Branch Address *</label>
                            <textarea name="Address" value={location.Address} onChange={(event) => handleEditLocationChange(index, event)} rows="2" required />
                          </div>
                          <div className="form-group">
                            <label>Google Map Link</label>
                            <input name="Google_Map_Link" value={location.Google_Map_Link} onChange={(event) => handleEditLocationChange(index, event)} />
                          </div>
                          <div className="form-group">
                            <label>Default Location</label>
                            <select name="Is_Default" value={location.Is_Default} onChange={(event) => handleEditLocationChange(index, event)}>
                              <option value="No">No</option>
                              <option value="Yes">Yes</option>
                            </select>
                          </div>
                          <div className="form-group full-width">
                            <label>Branch Notes</label>
                            <textarea name="Notes" value={location.Notes} onChange={(event) => handleEditLocationChange(index, event)} rows="2" />
                          </div>
                        </div>
                      </section>
                    ))}
                  </div>
                )}
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

function customerUnitsForLocation(customerUnits, locationId) {
  return (customerUnits || []).filter(
    (unit) => normalizeValue(unit.Location_ID) === normalizeValue(locationId)
  );
}

function isYesValue(value) {
  return ["yes", "true", "1"].includes(normalizeValue(value));
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

function buildCustomerSearchText(customer, customerUnits, customerLocations = []) {
  return normalizeSearchText([
    ...Object.values(customer || {}),
    ...customerUnits.flatMap((unit) => Object.values(unit || {})),
    ...customerLocations.flatMap((location) => Object.values(location || {})),
  ].join(" "));
}

function buildCustomerSearchFields(customer, customerUnits, customerLocations = []) {
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
    phone: buildCustomerPhoneSearchText(customer, customerUnits, customerLocations),
    address: normalizeSearchText([
      customer.Address,
      customer.address,
      customer.Google_Map_Link,
      customer.Google_Map_Li,
      customer["Google Map Link"],
      ...customerLocations.flatMap((location) => [
        location.Branch_Name,
        location.Address,
        location.Google_Map_Link,
      ]),
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

function buildCustomerPhoneSearchText(customer, customerUnits, customerLocations = []) {
  const phones = [
    ...getPhoneValues(customer),
    ...customerUnits.flatMap(getPhoneValues),
    ...customerLocations.flatMap(getPhoneValues),
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

function getGeneratedCustomerNameInfo(customerName) {
  const match = String(customerName || "").match(
    /^Unknown Customer\s+(Online|Showroom)\s+Row\s+(\d+)$/i
  );

  if (!match) return null;

  return {
    source: match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase(),
    row: match[2],
  };
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
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
