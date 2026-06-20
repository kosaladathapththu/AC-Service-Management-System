import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  addSale,
  checkDuplicateCustomer,
  getAllData,
} from "../api/googleSheetApi";
import CustomerSearchSelect, {
  getFilteredCustomers,
} from "../components/CustomerSearchSelect";
import CustomerLocationSelect from "../components/CustomerLocationSelect";
import { emptyLocationData } from "../utils/customerLocations";

function AddSale() {
  const today = new Date().toISOString().split("T")[0];

  function createEmptyACUnit() {
    return {
      AC_Model: "",
      Serial_Number: "",
      Invoice_Number: "",
      Quantity: "1",
      Price: "",
      Purchase_Date: today,
      Sales_Channel: "Showroom",
      Warranty_Start_Date: today,
      Warranty_End_Date: "",
      Warranty_Status: "Active",
    };
  }

  function createEmptyLocationEntry(customerId = "") {
    return {
      ...emptyLocationData(customerId),
      _temporaryKey: `branch-${Date.now()}-${Math.random()}`,
      acUnits: [createEmptyACUnit()],
    };
  }

  const emptyForm = {
    Customer_ID: "",
    Customer_Name: "",
    Phone: "",
    Email: "",
    Address: "",
    Google_Map_Link: "",
    Created_Date: today,
    Notes: "",
    Location_ID: "",

    AC_Model: "",
    Serial_Number: "",
    Invoice_Number: "",
    Quantity: "1",
    Price: "",
    Purchase_Date: today,
    Sales_Channel: "Showroom",
    Warranty_Start_Date: today,
    Warranty_End_Date: "",
    Warranty_Status: "Active",
  };

  const [saleMode, setSaleMode] = useState("new");
  const [customers, setCustomers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [addBranch, setAddBranch] = useState(false);
  const [locationEntries, setLocationEntries] = useState([
    createEmptyLocationEntry(),
  ]);
  const [acSaleItems, setAcSaleItems] = useState([createEmptyACUnit()]);
  const [customerSearch, setCustomerSearch] = useState("");

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateFound, setDuplicateFound] = useState(null);
  const [duplicateCheckStatus, setDuplicateCheckStatus] = useState("idle");
  const latestPhoneRef = useRef("");

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoadingCustomers(true);
      const [customerData, locationRows] = await Promise.all([
        getAllData("customers"),
        getAllData("customerLocations"),
      ]);
      setCustomers(customerData);
      setLocations(locationRows);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoadingCustomers(false);
    }
  }

  function handleModeChange(mode) {
    setSaleMode(mode);
    setSuccessMessage("");
    setError("");
    setDuplicateFound(null);
    setDuplicateCheckStatus("idle");
    latestPhoneRef.current = "";
    setCustomerSearch("");

    setFormData(emptyForm);
    setAddBranch(false);
    setLocationEntries([createEmptyLocationEntry()]);
    setAcSaleItems([createEmptyACUnit()]);
  }

  function handleCustomerSelect(event) {
    const customerId = event.target.value;
    const selectedCustomer = customers.find(
      (customer) =>
        normalizeText(getCustomerIdForSearch(customer)) ===
        normalizeText(customerId)
    );

    selectExistingCustomer(selectedCustomer, customerId);
  }

  function selectExistingCustomer(selectedCustomer, customerId) {
    setFormData((prev) => ({
      ...prev,
      Customer_ID: customerId || selectedCustomer?.Customer_ID || "",
      Customer_Name: selectedCustomer?.Customer_Name || "",
      Phone: selectedCustomer?.Phone || "",
      Email: selectedCustomer?.Email || "",
      Address: selectedCustomer?.Address || "",
      Google_Map_Link:
        selectedCustomer?.Google_Map_Link ||
        selectedCustomer?.Google_Map_Li ||
        "",
      Created_Date: selectedCustomer?.Created_Date || today,
      Notes: selectedCustomer?.Notes || "",
      Location_ID: "",
    }));
    latestPhoneRef.current = selectedCustomer?.Phone || "";
    if (selectedCustomer) {
      setCustomerSearch(
        `${selectedCustomer.Customer_ID} - ${selectedCustomer.Customer_Name || ""}`
      );
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "Phone" && saleMode === "new") {
      latestPhoneRef.current = value;
      checkForDuplicate(value);
    }
  }

  function handleACItemChange(index, event) {
    const { name, value } = event.target;

    setAcSaleItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [name]: value } : item
      )
    );
  }

  function handleLocationChange(index, event) {
    const { name, value } = event.target;
    setLocationEntries((previous) =>
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

  function addLocationEntry() {
    setLocationEntries((previous) => [
      ...previous,
      createEmptyLocationEntry(formData.Customer_ID),
    ]);
  }

  function handleBranchACItemChange(locationIndex, acIndex, event) {
    const { name, value } = event.target;
    setLocationEntries((previous) =>
      previous.map((location, currentLocationIndex) =>
        currentLocationIndex === locationIndex
          ? {
              ...location,
              acUnits: location.acUnits.map((unit, currentACIndex) =>
                currentACIndex === acIndex ? { ...unit, [name]: value } : unit
              ),
            }
          : location
      )
    );
  }

  function addBranchACItem(locationIndex) {
    setLocationEntries((previous) =>
      previous.map((location, currentLocationIndex) =>
        currentLocationIndex === locationIndex
          ? { ...location, acUnits: [...location.acUnits, createEmptyACUnit()] }
          : location
      )
    );
  }

  function removeBranchACItem(locationIndex, acIndex) {
    setLocationEntries((previous) =>
      previous.map((location, currentLocationIndex) =>
        currentLocationIndex === locationIndex
          ? {
              ...location,
              acUnits:
                location.acUnits.length === 1
                  ? location.acUnits
                  : location.acUnits.filter((_, currentACIndex) => currentACIndex !== acIndex),
            }
          : location
      )
    );
  }

  function removeLocationEntry(index) {
    setLocationEntries((previous) =>
      previous.length === 1
        ? previous
        : previous.filter((_, locationIndex) => locationIndex !== index)
    );
  }

  function addACItem() {
    setAcSaleItems((prev) => [...prev, createEmptyACUnit()]);
  }

  function removeACItem(index) {
    setAcSaleItems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  async function checkForDuplicate(phone) {
    const cleanPhone = normalizePhone(phone);

    if (cleanPhone.length < 7) {
      setDuplicateFound(null);
      setDuplicateCheckStatus("idle");
      setError("");
      return;
    }

    try {
      setCheckingDuplicate(true);
      setDuplicateCheckStatus("checking");
      setError("");
      const foundCustomer = findCustomerByPhone(customers, phone);

      if (!isLatestPhone(phone, latestPhoneRef.current)) return;

      if (foundCustomer) {
        setDuplicateFound(foundCustomer);
        setDuplicateCheckStatus("existing");
        setError(getDuplicateCustomerMessage(foundCustomer));
      } else {
        const apiDuplicate = await checkDuplicateCustomer(phone);
        const duplicateCustomer = normalizeDuplicateCustomer(apiDuplicate);

        if (!isLatestPhone(phone, latestPhoneRef.current)) return;

        setDuplicateFound(duplicateCustomer);
        setDuplicateCheckStatus(duplicateCustomer ? "existing" : "new");
        setError(
          duplicateCustomer ? getDuplicateCustomerMessage(duplicateCustomer) : ""
        );
      }
    } catch {
      const foundCustomer = findCustomerByPhone(customers, phone);
      if (!isLatestPhone(phone, latestPhoneRef.current)) return;

      setDuplicateFound(foundCustomer);
      setDuplicateCheckStatus(foundCustomer ? "existing" : "idle");
      setError(foundCustomer ? getDuplicateCustomerMessage(foundCustomer) : "");
    } finally {
      if (isLatestPhone(phone, latestPhoneRef.current)) {
        setCheckingDuplicate(false);
      }
    }
  }

  function handleUseDuplicateCustomer() {
    if (!duplicateFound) return;

    setSaleMode("existing");
    setFormData((prev) => ({
      ...prev,
      Customer_ID: duplicateFound.Customer_ID,
      Customer_Name: duplicateFound.Customer_Name || "",
      Phone: duplicateFound.Phone || "",
      Email: duplicateFound.Email || "",
      Address: duplicateFound.Address || "",
      Google_Map_Link:
        duplicateFound.Google_Map_Link ||
        duplicateFound.Google_Map_Li ||
        "",
      Created_Date: duplicateFound.Created_Date || today,
      Notes: duplicateFound.Notes || "",
    }));
    setDuplicateFound(null);
    setDuplicateCheckStatus("idle");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const branchSales = addBranch
        ? locationEntries.map((location) => ({
            location: getLocationPayload(location),
            acUnits: getValidACSaleItems(location.acUnits),
          }))
        : [];
      const saleItems = addBranch
        ? branchSales.flatMap((branch) => branch.acUnits)
        : getValidACSaleItems(acSaleItems);

      if (saleItems.length === 0) {
        throw new Error("Please add at least one AC model for this sale.");
      }

      const payload = {
        ...formData,
        acUnits: saleItems,
        Branch_Sales: branchSales,
      };

      if (
        addBranch &&
        locationEntries.some(
          (location) => !location.Branch_Name.trim() || !location.Address.trim()
        )
      ) {
        throw new Error("Branch name and branch address are required for every branch.");
      }

      if (addBranch && branchSales.some((branch) => branch.acUnits.length === 0)) {
        throw new Error("Please add at least one AC unit for every branch.");
      }

      if (saleMode === "new") {
        const existingCustomer =
          duplicateFound || (await findDuplicateCustomer(payload.Phone));

        if (existingCustomer) {
          setDuplicateFound(existingCustomer);
          throw new Error(getDuplicateCustomerMessage(existingCustomer));
        }

        payload.Customer_ID = "";
      }

      if (saleMode === "existing" && !payload.Customer_ID) {
        throw new Error("Please select an existing customer.");
      }

      const result = await addSale(payload);
      const acIds = result.acIds || (result.acId ? [result.acId] : []);

      setSuccessMessage(
        `Sale recorded successfully - Customer ID: ${result.customerId} - AC units: ${acIds.join(", ")}`
      );

      setFormData(emptyForm);
      setAddBranch(false);
      setLocationEntries([createEmptyLocationEntry()]);
      setAcSaleItems([createEmptyACUnit()]);
      setSaleMode("new");
      await loadCustomers();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFormData(emptyForm);
    setAddBranch(false);
    setLocationEntries([createEmptyLocationEntry()]);
    setAcSaleItems([createEmptyACUnit()]);
    setSaleMode("new");
    setCustomerSearch("");
    setSuccessMessage("");
    setError("");
    setDuplicateFound(null);
    setDuplicateCheckStatus("idle");
    latestPhoneRef.current = "";
  }

  async function findDuplicateCustomer(phone) {
    const foundCustomer = findCustomerByPhone(customers, phone);

    if (foundCustomer) return foundCustomer;

    try {
      const apiDuplicate = await checkDuplicateCustomer(phone);
      return normalizeDuplicateCustomer(apiDuplicate);
    } catch {
      return null;
    }
  }

  const filteredCustomers = getFilteredCustomers(
    customers,
    customerSearch,
    getCustomerIdForSearch,
    getCustomerNameForSearch
  );
  const selectedCustomer = customers.find(
    (customer) =>
      normalizeText(getCustomerIdForSearch(customer)) ===
      normalizeText(formData.Customer_ID)
  );
  const customerOptions = getCustomerOptions(filteredCustomers, selectedCustomer);

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/" className="back-link">
            ← Back to Dashboard
          </Link>
          <h2>Add New Sale</h2>
          <p>
            Register a new customer sale or add another AC unit to an existing
            customer.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          {successMessage}
        </div>
      )}

      {error && (
        <div className={duplicateFound ? "alert alert-error alert-long" : "alert alert-error"}>
          <span className="alert-icon">✕</span>
          {error}
        </div>
      )}

      {duplicateFound && (
        <div className="alert alert-warning alert-persistent">
          <div className="alert-content">
            <div className="alert-header">
              <span className="alert-icon">⚠️</span>
              <strong>Customer Already Exists</strong>
            </div>
            <p>
              A customer with phone number <strong>{formData.Phone}</strong>{" "}
              already exists in the system. Use the existing customer record
              instead of creating a duplicate.
            </p>
            <div className="duplicate-customer-info">
              <p>
                <strong>
                  {duplicateFound.Customer_ID} - {duplicateFound.Customer_Name}
                </strong>
              </p>
              <p>{duplicateFound.Phone}</p>
              <p className="text-gray">{duplicateFound.Address || "Address not provided"}</p>
            </div>
            <div className="duplicate-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleUseDuplicateCustomer}
              >
                Use This Customer
              </button>
            </div>
          </div>
        </div>
      )}

      <form className="sale-form" onSubmit={handleSubmit}>
        <div className="sale-mode-card">
          <div>
            <h3>Sale Type</h3>
            <p>Select whether this AC is for a new customer or existing customer.</p>
          </div>

          <div className="sale-mode-actions">
            <button
              type="button"
              className={
                saleMode === "new" ? "sale-mode-btn active" : "sale-mode-btn"
              }
              onClick={() => handleModeChange("new")}
            >
              New Customer
            </button>

            <button
              type="button"
              className={
                saleMode === "existing"
                  ? "sale-mode-btn active"
                  : "sale-mode-btn"
              }
              onClick={() => handleModeChange("existing")}
            >
              Existing Customer
            </button>
          </div>
        </div>

        {saleMode === "existing" && (
          <div className="form-card">
            <div className="form-card-header">
              <div className="form-card-icon">👥</div>
              <div>
                <h3>Select Existing Customer</h3>
                <p>This AC will be added under the selected customer profile.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>Search Customer</label>
                <CustomerSearchSelect
                  customers={customers}
                  query={customerSearch}
                  onQueryChange={setCustomerSearch}
                  onSelectCustomer={selectExistingCustomer}
                  getCustomerId={getCustomerIdForSearch}
                  getCustomerName={getCustomerNameForSearch}
                  disabled={loadingCustomers}
                />
              </div>

              <div className="form-group full-width">
                <label>
                  Customer <span className="required">*</span>
                </label>

                <select
                  name="Customer_ID"
                  value={formData.Customer_ID}
                  onChange={handleCustomerSelect}
                  required
                  disabled={loadingCustomers}
                >
                  <option value="">
                    {loadingCustomers
                      ? "Loading customers..."
                      : "Select customer"}
                  </option>

                  {customerOptions.map((customer) => {
                    const customerId = getCustomerIdForSearch(customer);

                    return (
                    <option
                      key={customerId}
                      value={customerId}
                    >
                      {customerId} - {getCustomerNameForSearch(customer)} -{" "}
                      {customer.Phone || "No phone"}
                    </option>
                    );
                  })}
                </select>
              </div>

              {formData.Customer_ID && (
                <div className="selected-customer-box full-width">
                  <p>
                    <strong>Name:</strong> {formData.Customer_Name || "—"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {formData.Phone || "—"}
                  </p>
                  <p>
                    <strong>Address:</strong> {formData.Address || "—"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {saleMode === "new" && (
          <div className="form-card">
            <div className="form-card-header">
              <div className="form-card-icon">👤</div>
              <div>
                <h3>Customer Details</h3>
                <p>Basic contact and location information.</p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  Customer Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="Customer_Name"
                  value={formData.Customer_Name}
                  onChange={handleChange}
                  placeholder="e.g. Kasun Perera"
                  required={saleMode === "new"}
                />
              </div>

              <div className="form-group">
                <label>
                  Phone <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="Phone"
                  value={formData.Phone}
                  onChange={handleChange}
                  placeholder="e.g. 077 123 4567"
                  required={saleMode === "new"}
                />
                <PhoneCheckHint status={duplicateCheckStatus} />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="Email"
                  value={formData.Email}
                  onChange={handleChange}
                  placeholder="e.g. customer@email.com"
                />
              </div>

              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="Address"
                  value={formData.Address}
                  onChange={handleChange}
                  placeholder="e.g. No. 12, Galle Road, Colombo"
                />
              </div>

              <div className="form-group">
                <label>Google Map Link</label>
                <input
                  type="text"
                  name="Google_Map_Link"
                  value={formData.Google_Map_Link}
                  onChange={handleChange}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div className="form-group">
                <label>Created Date</label>
                <input
                  type="date"
                  name="Created_Date"
                  value={formData.Created_Date}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        )}

        <div className="form-card">
          <div className="form-card-header">
            <div className="form-card-icon">📍</div>
            <div>
              <h3>Branch / Delivery Location</h3>
              <p>Optional. Single buyers can continue using the customer&apos;s main address.</p>
            </div>
          </div>

          <div className="form-grid">
            {saleMode === "existing" && !addBranch && (
              <CustomerLocationSelect
                customerId={formData.Customer_ID}
                locations={locations}
                value={formData.Location_ID}
                onChange={handleChange}
                disabled={!formData.Customer_ID}
              />
            )}

            <div className="form-group full-width">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={addBranch}
                  onChange={(event) => {
                    setAddBranch(event.target.checked);
                    setFormData((previous) => ({ ...previous, Location_ID: "" }));
                    setLocationEntries([createEmptyLocationEntry(formData.Customer_ID)]);
                  }}
                />
                Add a new branch/location for this sale
              </label>
            </div>

            {addBranch && (
              <div className="sale-location-list full-width">
                {locationEntries.map((location, index) => (
                  <section className="edit-location-card" key={location._temporaryKey || index}>
                    <div className="edit-location-card-header">
                      <div>
                        <strong>{index === 0 ? "Sale Delivery Branch" : `Additional Branch ${index}`}</strong>
                        <small>{index === 0 ? "AC units in this sale will be assigned here" : "Saved under the same customer"}</small>
                      </div>
                      {index > 0 && (
                        <button type="button" className="cancel-btn" onClick={() => removeLocationEntry(index)}>Remove</button>
                      )}
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Branch Name <span className="required">*</span></label>
                        <input name="Branch_Name" value={location.Branch_Name} onChange={(event) => handleLocationChange(index, event)} placeholder="e.g. Kandy Branch" required />
                      </div>
                      <div className="form-group">
                        <label>Contact Person</label>
                        <input name="Contact_Person" value={location.Contact_Person} onChange={(event) => handleLocationChange(index, event)} placeholder="Branch contact name" />
                      </div>
                      <div className="form-group">
                        <label>Branch Phone</label>
                        <input name="Phone" value={location.Phone} onChange={(event) => handleLocationChange(index, event)} placeholder="e.g. 081 123 4567" />
                      </div>
                      <div className="form-group">
                        <label>Branch Address <span className="required">*</span></label>
                        <input name="Address" value={location.Address} onChange={(event) => handleLocationChange(index, event)} placeholder="Full service address" required />
                      </div>
                      <div className="form-group">
                        <label>Google Map Link</label>
                        <input name="Google_Map_Link" value={location.Google_Map_Link} onChange={(event) => handleLocationChange(index, event)} placeholder="https://maps.google.com/..." />
                      </div>
                      <div className="form-group">
                        <label>Default Location</label>
                        <select name="Is_Default" value={location.Is_Default} onChange={(event) => handleLocationChange(index, event)}>
                          <option value="No">No</option>
                          <option value="Yes">Yes</option>
                        </select>
                      </div>
                      <div className="form-group full-width">
                        <label>Location Notes</label>
                        <textarea name="Notes" value={location.Notes} onChange={(event) => handleLocationChange(index, event)} rows="2" />
                      </div>
                    </div>

                    <div className="branch-ac-section">
                      <div className="branch-ac-section-header">
                        <div>
                          <h4>AC Units &amp; Invoices for this Branch</h4>
                          <p>Every unit entered here will be linked to {location.Branch_Name || `Branch ${index + 1}`}.</p>
                        </div>
                      </div>

                      <div className="multi-ac-list">
                        {location.acUnits.map((item, acIndex) => (
                          <ACSaleItemFields
                            key={acIndex}
                            item={item}
                            index={acIndex}
                            canRemove={location.acUnits.length > 1}
                            onChange={(event) => handleBranchACItemChange(index, acIndex, event)}
                            onRemove={() => removeBranchACItem(index, acIndex)}
                          />
                        ))}
                      </div>

                      <button type="button" className="btn-secondary" onClick={() => addBranchACItem(index)}>
                        + Add Another AC to this Branch
                      </button>
                    </div>
                  </section>
                ))}

                <button type="button" className="btn-secondary add-another-branch-btn" onClick={addLocationEntry}>
                  + Add Another Branch
                </button>
              </div>
            )}
          </div>
        </div>

        {!addBranch && (<div className="form-card">
          <div className="form-card-header">
            <div className="form-card-icon">❄️</div>
            <div>
              <h3>AC Unit &amp; Sale Details</h3>
              <p>Model, pricing, warranty, and sales channel information.</p>
            </div>
          </div>

          <div className="multi-ac-list">
            {acSaleItems.map((item, index) => (
              <div className="multi-ac-item" key={index}>
                <div className="multi-ac-item-header">
                  <div>
                    <h4>AC Unit {index + 1}</h4>
                    <p>Enter one row for each different AC model.</p>
                  </div>

                  {acSaleItems.length > 1 && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => removeACItem(index)}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      AC Model <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="AC_Model"
                      value={item.AC_Model}
                      onChange={(event) => handleACItemChange(index, event)}
                      placeholder="e.g. Samsung WindFree 18000 BTU"
                      required={index === 0}
                    />
                  </div>

                  <div className="form-group">
                    <label>Serial Number</label>
                    <input
                      type="text"
                      name="Serial_Number"
                      value={item.Serial_Number}
                      onChange={(event) => handleACItemChange(index, event)}
                      placeholder="e.g. SN-2024-00123"
                    />
                  </div>

                  <div className="form-group">
                    <label>Invoice Number</label>
                    <input
                      type="text"
                      name="Invoice_Number"
                      value={item.Invoice_Number}
                      onChange={(event) => handleACItemChange(index, event)}
                      placeholder="e.g. 1337850"
                    />
                  </div>

                  <div className="form-group">
                    <label>Quantity</label>
                    <input
                      type="number"
                      name="Quantity"
                      value={item.Quantity}
                      onChange={(event) => handleACItemChange(index, event)}
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Price (LKR)</label>
                    <input
                      type="number"
                      name="Price"
                      value={item.Price}
                      onChange={(event) => handleACItemChange(index, event)}
                      placeholder="e.g. 185000"
                      min="0"
                    />
                  </div>

                  <div className="form-group">
                    <label>Purchase Date</label>
                    <input
                      type="date"
                      name="Purchase_Date"
                      value={item.Purchase_Date}
                      onChange={(event) => handleACItemChange(index, event)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Sales Channel</label>
                    <select
                      name="Sales_Channel"
                      value={item.Sales_Channel}
                      onChange={(event) => handleACItemChange(index, event)}
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
                      value={item.Warranty_Start_Date}
                      onChange={(event) => handleACItemChange(index, event)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Warranty End Date</label>
                    <input
                      type="date"
                      name="Warranty_End_Date"
                      value={item.Warranty_End_Date}
                      onChange={(event) => handleACItemChange(index, event)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Warranty Status</label>
                    <select
                      name="Warranty_Status"
                      value={item.Warranty_Status}
                      onChange={(event) => handleACItemChange(index, event)}
                    >
                      <option value="Active">Active</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <span className="form-hint">
                      Automatically becomes Expired after the warranty end date.
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="btn-secondary" onClick={addACItem}>
            + Add Another AC Model
          </button>
        </div>)}

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleReset}
            disabled={loading}
          >
            Clear Form
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || checkingDuplicate || Boolean(duplicateFound)}
          >
            {loading ? (
              <>
                <span className="spinner" /> Saving...
              </>
            ) : saleMode === "existing" ? (
              "Add AC to Customer"
            ) : (
              "Save Sale"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function ACSaleItemFields({ item, index, canRemove, onChange, onRemove }) {
  return (
    <div className="multi-ac-item branch-ac-item">
      <div className="multi-ac-item-header">
        <div>
          <h4>AC Unit {index + 1}</h4>
          <p>Model, invoice, pricing and warranty for this branch.</p>
        </div>
        {canRemove && <button type="button" className="btn-secondary" onClick={onRemove}>Remove AC</button>}
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>AC Model <span className="required">*</span></label>
          <input name="AC_Model" value={item.AC_Model} onChange={onChange} placeholder="e.g. Samsung WindFree 18000 BTU" required />
        </div>
        <div className="form-group">
          <label>Serial Number</label>
          <input name="Serial_Number" value={item.Serial_Number} onChange={onChange} placeholder="e.g. SN-2024-00123" />
        </div>
        <div className="form-group">
          <label>Invoice Number</label>
          <input name="Invoice_Number" value={item.Invoice_Number} onChange={onChange} placeholder="e.g. 1337850" />
        </div>
        <div className="form-group">
          <label>Quantity</label>
          <input type="number" name="Quantity" value={item.Quantity} onChange={onChange} min="1" />
        </div>
        <div className="form-group">
          <label>Price (LKR)</label>
          <input type="number" name="Price" value={item.Price} onChange={onChange} min="0" placeholder="e.g. 185000" />
        </div>
        <div className="form-group">
          <label>Purchase Date</label>
          <input type="date" name="Purchase_Date" value={item.Purchase_Date} onChange={onChange} />
        </div>
        <div className="form-group">
          <label>Sales Channel</label>
          <select name="Sales_Channel" value={item.Sales_Channel} onChange={onChange}>
            <option value="Showroom">Showroom</option>
            <option value="Online">Online</option>
          </select>
        </div>
        <div className="form-group">
          <label>Warranty Start Date</label>
          <input type="date" name="Warranty_Start_Date" value={item.Warranty_Start_Date} onChange={onChange} />
        </div>
        <div className="form-group">
          <label>Warranty End Date</label>
          <input type="date" name="Warranty_End_Date" value={item.Warranty_End_Date} onChange={onChange} />
        </div>
        <div className="form-group">
          <label>Warranty Status</label>
          <select name="Warranty_Status" value={item.Warranty_Status} onChange={onChange}>
            <option value="Active">Active</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <span className="form-hint">Automatically becomes Expired after the warranty end date.</span>
        </div>
      </div>
    </div>
  );
}

function getLocationPayload(location) {
  const { acUnits, _temporaryKey, ...locationData } = location;
  void acUnits;
  void _temporaryKey;
  return locationData;
}

function getValidACSaleItems(items) {
  return items
    .map((item) => ({
      ...item,
      AC_Model: String(item.AC_Model || "").trim(),
      Serial_Number: String(item.Serial_Number || "").trim(),
      Invoice_Number: String(item.Invoice_Number || "").trim(),
      Quantity: item.Quantity || "1",
      Price: item.Price || "",
      Purchase_Date: item.Purchase_Date || "",
      Sales_Channel: item.Sales_Channel || "Showroom",
      Warranty_Start_Date: item.Warranty_Start_Date || "",
      Warranty_End_Date: item.Warranty_End_Date || "",
      Warranty_Status: item.Warranty_Status || "Active",
    }))
    .filter((item) => item.AC_Model);
}

function findCustomerByPhone(customers, phone) {
  const cleanPhone = normalizePhone(phone);

  if (!cleanPhone) return null;

  return (
    customers.find(
      (customer) => normalizePhone(customer.Phone) === cleanPhone
    ) || null
  );
}

function PhoneCheckHint({ status }) {
  if (status === "checking") {
    return (
      <span className="form-hint">
        Searching phone number to check existing customer...
      </span>
    );
  }

  if (status === "existing") {
    return (
      <span className="form-hint form-hint-error">
        Existing customer found for this phone number.
      </span>
    );
  }

  if (status === "new") {
    return (
      <span className="form-hint form-hint-success">
        No existing customer found. This looks like a new customer.
      </span>
    );
  }

  return null;
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

function isLatestPhone(phone, latestPhone) {
  return normalizePhone(phone) === normalizePhone(latestPhone);
}

function normalizeDuplicateCustomer(value) {
  if (!value) return null;

  if (value.exists === false) return null;

  const customer = value.customer || value;

  if (!customer.Customer_ID && !customer.Customer_Name && !customer.Phone) {
    return null;
  }

  return customer;
}

function getDuplicateCustomerMessage(customer) {
  return `Customer already exists with this phone number. Use existing customer ${customer.Customer_ID} instead.`;
}

function getCustomerIdForSearch(customer) {
  return customer.Customer_ID || customer.customer_ID || customer.id || "";
}

function getCustomerNameForSearch(customer) {
  return customer.Customer_Name || customer.name || "Unnamed Customer";
}

function getCustomerOptions(filteredCustomers, selectedCustomer) {
  if (!selectedCustomer) return filteredCustomers;

  const selectedId = normalizeText(getCustomerIdForSearch(selectedCustomer));
  const hasSelectedCustomer = filteredCustomers.some(
    (customer) => normalizeText(getCustomerIdForSearch(customer)) === selectedId
  );

  return hasSelectedCustomer
    ? filteredCustomers
    : [selectedCustomer, ...filteredCustomers];
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

export default AddSale;
